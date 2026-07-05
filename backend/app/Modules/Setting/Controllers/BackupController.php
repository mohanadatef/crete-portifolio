<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Setting\Services\BackupService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\JsonResponse;
use Exception;

class BackupController extends Controller
{
    public function __construct(private readonly BackupService $backupService)
    {
        // Enforce specific permission for backup downloads
        $this->middleware('permission:download-backups');
    }

    /**
     * Generate database backup and return as downloaded file.
     *
     * @return BinaryFileResponse|JsonResponse
     */
    public function download(): BinaryFileResponse|JsonResponse
    {
        try {
            $zipPath = $this->backupService->generateBackup();
            
            // Return binary file download and delete file from storage after sending to prevent storage build-up
            return response()->download($zipPath)->deleteFileAfterSend(true);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BackupController@download: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Backup failed: ' . $e->getMessage(), 500);
        }
    }
}
