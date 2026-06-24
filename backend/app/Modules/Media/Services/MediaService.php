<?php

namespace App\Modules\Media\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;

class MediaService
{
    /**
     * Process and store project images.
     *
     * @param Model $model Typically a Project model
     * @param array $files Uploaded files array
     * @param string $pathPrefix The folder to store images
     * @return void
     */
    public function processAndStoreProjectImages(Model $model, array $files, string $pathPrefix = 'projects', ?int $primaryIndex = null): void
    {
        $manager = new ImageManager(new Driver());
        
        foreach ($files as $index => $file) {
            $filename = uniqid($pathPrefix . '_') . '_' . time();
            $mimeType = $file->getMimeType();
            $isPrimary = ($primaryIndex !== null) ? ($index === $primaryIndex) : ($index === 0);

            if (str_starts_with($mimeType, 'video/')) {
                // Store video directly
                $extension = $file->getClientOriginalExtension();
                $path = $file->storeAs($pathPrefix, $filename . '.' . $extension, 'public');
                
                $model->projectImages()->create([
                    'image_path' => '/storage/' . $path,
                    'is_primary' => $isPrimary
                ]);
            } else {
                // Main image
                try {
                    $image = $manager->read($file->getRealPath());
                    $image->scaleDown(width: 1920);
                    $encoded = $image->toWebp(75);
                    Storage::disk('public')->put($pathPrefix . '/' . $filename . '.webp', $encoded->toString());

                    // Thumbnail
                    $thumb = $manager->read($file->getRealPath());
                    $thumb->coverDown(width: 600, height: 400);
                    $encodedThumb = $thumb->toWebp(70);
                    Storage::disk('public')->put($pathPrefix . '/' . $filename . '_thumb.webp', $encodedThumb->toString());

                    $model->projectImages()->create([
                        'image_path' => '/storage/' . $pathPrefix . '/' . $filename . '.webp',
                        'is_primary' => $isPrimary
                    ]);
                } catch (\Exception $e) {
                    // Fallback to storing original file if decoding fails
                    $extension = $file->getClientOriginalExtension();
                    $path = $file->storeAs($pathPrefix, $filename . '.' . $extension, 'public');
                    
                    $model->projectImages()->create([
                        'image_path' => '/storage/' . $path,
                        'is_primary' => $isPrimary
                    ]);
                }
            }
        }
    }

    /**
     * Process and store files for project units/spaces.
     */
    public function processAndStoreUnitFiles(array $files, string $pathPrefix = 'projects/units'): array
    {
        $manager = new ImageManager(new Driver());
        $paths = [];

        foreach ($files as $file) {
            $filename = uniqid('unit_') . '_' . time();
            $mimeType = $file->getMimeType();

            if (str_starts_with($mimeType, 'video/')) {
                $extension = $file->getClientOriginalExtension();
                $path = $file->storeAs($pathPrefix, $filename . '.' . $extension, 'public');
                $paths[] = '/storage/' . $path;
            } else {
                try {
                    $image = $manager->read($file->getRealPath());
                    $image->scaleDown(width: 1200);
                    $encoded = $image->toWebp(75);
                    Storage::disk('public')->put($pathPrefix . '/' . $filename . '.webp', $encoded->toString());
                    $paths[] = '/storage/' . $pathPrefix . '/' . $filename . '.webp';
                } catch (\Exception $e) {
                    $extension = $file->getClientOriginalExtension();
                    $path = $file->storeAs($pathPrefix, $filename . '.' . $extension, 'public');
                    $paths[] = '/storage/' . $path;
                }
            }
        }

        return $paths;
    }

    /**
     * Store a general media file.
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return \App\Modules\Media\Models\Media
     */
    public function storeMedia(\Illuminate\Http\UploadedFile $file): \App\Modules\Media\Models\Media
    {
        $manager = new ImageManager(new Driver());
        $filename = uniqid('media_') . '_' . time();
        $isImage = str_starts_with($file->getMimeType(), 'image/');

        if ($isImage && !in_array($file->getMimeType(), ['image/svg+xml', 'image/gif'])) {
            $image = $manager->read($file->getRealPath());
            
            // Scale down if width is too large to save space
            if ($image->width() > 1920) {
                $image->scaleDown(width: 1920);
            }
            
            $encoded = $image->toWebp(75);
            $path = 'media/' . $filename . '.webp';
            Storage::disk('public')->put($path, $encoded->toString());
            $mimeType = 'image/webp';
            $size = strlen($encoded->toString());
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME) . '.webp';
        } else {
            $path = $file->storeAs('media', $filename . '.' . $file->getClientOriginalExtension(), 'public');
            $mimeType = $file->getMimeType();
            $size = $file->getSize();
            $originalName = $file->getClientOriginalName();
        }

        return \App\Modules\Media\Models\Media::create([
            'file_name' => $originalName,
            'path' => '/storage/' . $path,
            'mime_type' => $mimeType,
            'size' => $size
        ]);
    }
}
