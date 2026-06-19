<?php

namespace App\Modules\Media\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Media\Services\MediaService;
use Exception;

class MediaController extends Controller
{
    public function __construct(private readonly MediaService $mediaService)
    {
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov,avi|max:20480',
            ]);

            $media = $this->mediaService->storeMedia($request->file('file'));

            return $this->successResponse([
                'url' => url($media->path),
                'path' => $media->path
            ], 'Media uploaded successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }
}
