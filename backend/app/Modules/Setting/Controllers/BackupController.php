<?php

namespace App\Modules\Setting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Setting\Services\BackupService;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\JsonResponse;
use Exception;

use App\Modules\Setting\Models\BackupLog;

class BackupController extends Controller
{
    public function __construct(private readonly BackupService $backupService)
    {
        // Enforce specific permission for backup downloads
        $this->middleware('permission:download-backups');
    }

    /**
     * List all database backup logs with user, filtering and pagination.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $query = BackupLog::with('user');

            // Filtering by status
            if (request()->has('status') && request()->query('status') !== 'ALL') {
                $query->where('status', request()->query('status'));
            }

            // Filtering by user search or filename
            if (request()->has('search') && !empty(request()->query('search'))) {
                $search = request()->query('search');
                $query->where(function ($q) use ($search) {
                    $q->where('filename', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
                          $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Order by latest
            $query->orderBy('created_at', 'desc');

            $logs = $query->paginate(request()->query('per_page', 10));

            return $this->successResponse($logs, 'Backup logs retrieved successfully.');
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BackupController@index: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to retrieve backup logs: ' . $e->getMessage(), 500);
        }
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
            
            // Log backup event in DB
            BackupLog::create([
                'user_id' => auth()->id(),
                'filename' => basename($zipPath),
                'status' => 'success'
            ]);

            // Return binary file download and delete file from storage after sending to prevent storage build-up
            return response()->download($zipPath)->deleteFileAfterSend(true);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('BackupController@download: ' . $e->getMessage(), ['exception' => $e]);
            
            // Log failed backup event in DB
            try {
                BackupLog::create([
                    'user_id' => auth()->id(),
                    'filename' => 'backup-failed-' . date('Y-m-d-H-i-s') . '.zip',
                    'status' => 'failed'
                ]);
            } catch (Exception $logEx) {
                \Illuminate\Support\Facades\Log::error('Failed to log failed backup event: ' . $logEx->getMessage());
            }

            return $this->errorResponse('Backup failed: ' . $e->getMessage(), 500);
        }
    }
}
