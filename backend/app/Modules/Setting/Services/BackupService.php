<?php

namespace App\Modules\Setting\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use ZipArchive;
use Exception;

class BackupService
{
    /**
     * Generate database SQL dump and package it into a ZIP file.
     *
     * @return string Path to the generated ZIP file
     * @throws Exception
     */
    public function generateBackup(): string
    {
        $connection = DB::connection();
        $driver = $connection->getDriverName();
        
        // Get database name from current configuration
        $dbName = config("database.connections.{$driver}.database") ?? 'database';
        
        // 1. Get all tables based on the driver
        $tables = [];
        if ($driver === 'sqlite') {
            $tablesQuery = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'migrations'");
            foreach ($tablesQuery as $tableObj) {
                $tables[] = $tableObj->name;
            }
        } else {
            $tablesQuery = DB::select('SHOW TABLES');
            foreach ($tablesQuery as $tableObj) {
                $tables[] = array_values((array)$tableObj)[0];
            }
        }

        if (empty($tables)) {
            throw new Exception("No tables found in the database to backup.");
        }

        // 2. Generate SQL Dump Content
        $sqlDump = "-- Crete Developments Portfolio Database Backup\n";
        $sqlDump .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sqlDump .= "-- Database: " . $dbName . "\n";
        $sqlDump .= "-- Driver: " . $driver . "\n";
        $sqlDump .= "-- ------------------------------------------------------\n\n";
        
        // Enable foreign key checks safety wrapper
        if ($driver === 'sqlite') {
            $sqlDump .= "PRAGMA foreign_keys = OFF;\n\n";
        } else {
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";
        }

        foreach ($tables as $table) {
            // Get create table statement
            if ($driver === 'sqlite') {
                $createStatementQuery = DB::select("SELECT sql FROM sqlite_master WHERE type='table' AND name = ?", [$table]);
                if (empty($createStatementQuery)) {
                    continue;
                }
                $createStatement = $createStatementQuery[0]->sql;
            } else {
                $createStatementQuery = DB::select("SHOW CREATE TABLE `{$table}`");
                $createStatement = array_values((array)$createStatementQuery[0])[1]; // Second column contains 'Create Table' SQL statement
            }
            
            $sqlDump .= "--\n";
            $sqlDump .= "-- Table structure for table `{$table}`\n";
            $sqlDump .= "--\n\n";
            $sqlDump .= "DROP TABLE IF EXISTS `{$table}`;\n";
            $sqlDump .= $createStatement . ";\n\n";

            // Fetch table rows
            $rows = DB::table($table)->get();
            if ($rows->count() > 0) {
                $sqlDump .= "--\n";
                $sqlDump .= "-- Dumping data for table `{$table}`\n";
                $sqlDump .= "--\n\n";
                
                foreach ($rows as $row) {
                    $rowArray = (array)$row;
                    $keys = array_keys($rowArray);
                    
                    // Escape values securely
                    $escapedValues = array_map(function ($val) {
                        if ($val === null) {
                            return 'NULL';
                        }
                        if (is_numeric($val) && !is_string($val)) {
                            return $val;
                        }
                        // Fallback escaping logic
                        $search = ["\\", "\x00", "\n", "\r", "'", '"', "\x1a"];
                        $replace = ["\\\\", "\\0", "\\n", "\\r", "\\'", '\\"', "\\Z"];
                        return "'" . str_replace($search, $replace, $val) . "'";
                    }, array_values($rowArray));

                    $sqlDump .= "INSERT INTO `{$table}` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $escapedValues) . ");\n";
                }
                $sqlDump .= "\n";
            }
        }

        // Restore foreign key checks
        if ($driver === 'sqlite') {
            $sqlDump .= "PRAGMA foreign_keys = ON;\n";
        } else {
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";
        }

        // 3. Compress into ZIP file
        $backupDir = storage_path('app/backups');
        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $zipPath = $backupDir . '/backup-' . date('Y-m-d-H-i-s') . '.zip';
        $zip = new ZipArchive();

        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new Exception("Could not create ZIP file at {$zipPath}");
        }

        $zip->addFromString('database-dump.sql', $sqlDump);
        $zip->close();

        return $zipPath;
    }
}
