<?php

namespace App\Modules\Media\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Media\Services\MediaService;
use Illuminate\Validation\ValidationException;
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
                'file' => 'required|file|mimes:jpg,jpeg,png,webp,mp4,mov,avi,woff,woff2,ttf,otf|max:102400',
            ]);

            $media = $this->mediaService->storeMedia($request->file('file'));

            return $this->successResponse([
                'url' => url($media->path),
                'path' => $media->path
            ], 'Media uploaded successfully', 201);
        } catch (ValidationException $e) {
            return $this->errorResponse($e->errors(), 422);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('MediaController@store: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to upload media.', 500);
        }
    }
}
