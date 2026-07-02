<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Exception;

class LogController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * List all log files.
     */
    public function index(): JsonResponse
    {
        try {
            $logPath = storage_path('logs');
            if (!File::exists($logPath)) {
                return $this->successResponse([], 'No logs found.');
            }

            $files = File::files($logPath);
            $logFiles = [];

            foreach ($files as $file) {
                $filename = $file->getFilename();
                // Only include laravel logs
                if (preg_match('/^laravel.*\.log$/', $filename)) {
                    // Extract date if it matches laravel-YYYY-MM-DD.log
                    $date = 'Current';
                    if (preg_match('/laravel-(\d{4}-\d{2}-\d{2})\.log/', $filename, $matches)) {
                        $date = $matches[1];
                    }

                    $logFiles[] = [
                        'filename' => $filename,
                        'size' => $this->formatBytes($file->getSize()),
                        'last_modified' => date('Y-m-d H:i:s', $file->getMTime()),
                        'date' => $date,
                        'raw_modified' => $file->getMTime()
                    ];
                }
            }

            // Sort by last modified descending
            usort($logFiles, function ($a, $b) {
                return $b['raw_modified'] <=> $a['raw_modified'];
            });

            return $this->successResponse($logFiles, 'Log files retrieved successfully.');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to retrieve log files: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get and parse content of a single log file.
     */
    public function show(string $filename): JsonResponse
    {
        try {
            // Prevent path traversal
            if (!preg_match('/^laravel[\w\-]*\.log$/', $filename)) {
                return $this->errorResponse('Invalid log file name.', 400);
            }

            $filePath = storage_path('logs/' . $filename);
            if (!File::exists($filePath)) {
                return $this->errorResponse('Log file not found.', 404);
            }

            // Get query params
            $page = (int)request()->query('page', 1);
            $perPage = (int)request()->query('per_page', 50);
            $level = strtoupper(request()->query('level', 'ALL'));
            $search = request()->query('search', '');

            // Read the last 5MB for paginated views to make sure we get enough entries
            $fileSize = File::size($filePath);
            $maxRead = 5 * 1024 * 1024; // 5MB
            $content = '';

            if ($fileSize > $maxRead) {
                $handle = fopen($filePath, 'r');
                fseek($handle, -$maxRead, SEEK_END);
                $content = fread($handle, $maxRead);
                fclose($handle);
                $content = "[... Truncated for performance, showing last 5MB ...]\n" . $content;
            } else {
                $content = File::get($filePath);
            }

            // Parse monolog entries
            $pattern = '/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+)\.(\w+): (.*?)(?=\n\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\]|\z)/s';
            preg_match_all($pattern, $content, $matches, PREG_SET_ORDER);

            $parsedLogs = [];
            foreach ($matches as $match) {
                $timestamp = $match[1];
                $env = $match[2];
                $logLevel = strtoupper($match[3]);
                $messageWithStack = $match[4];

                // Split message and stack trace if present
                $lines = explode("\n", $messageWithStack);
                $message = $lines[0];
                $stackTrace = count($lines) > 1 ? implode("\n", array_slice($lines, 1)) : '';

                // Filter by Level
                if ($level !== 'ALL' && $logLevel !== $level) {
                    continue;
                }

                // Filter by Search Query
                if (!empty($search)) {
                    $searchLower = strtolower($search);
                    $msgLower = strtolower($message);
                    $traceLower = strtolower($stackTrace);
                    if (strpos($msgLower, $searchLower) === false && strpos($traceLower, $searchLower) === false) {
                        continue;
                    }
                }

                $parsedLogs[] = [
                    'timestamp' => $timestamp,
                    'environment' => $env,
                    'level' => $logLevel,
                    'message' => $message,
                    'stack_trace' => $stackTrace,
                    'type' => $this->getLogLevelClass($logLevel)
                ];
            }

            // Return latest logs first
            $parsedLogs = array_reverse($parsedLogs);

            // Paginate
            $total = count($parsedLogs);
            $lastPage = (int)ceil($total / $perPage);
            $page = max(1, min($page, $lastPage ?: 1));
            
            $paginatedLogs = array_slice($parsedLogs, ($page - 1) * $perPage, $perPage);

            return $this->successResponse([
                'filename' => $filename,
                'logs' => $paginatedLogs,
                'pagination' => [
                    'current_page' => $page,
                    'last_page' => $lastPage,
                    'per_page' => $perPage,
                    'total' => $total
                ]
            ], 'Log file parsed successfully.');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to read log file: ' . $e->getMessage(), 500);
        }
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }

    private function getLogLevelClass(string $level): string
    {
        $level = strtolower($level);
        return match($level) {
            'error', 'critical', 'alert', 'emergency' => 'danger',
            'warning' => 'warning',
            'info', 'notice' => 'info',
            default => 'secondary'
        };
    }
}
