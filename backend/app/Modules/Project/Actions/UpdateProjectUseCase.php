<?php

namespace App\Modules\Project\Actions;

use App\Modules\Project\DTOs\ProjectDTO;
use App\Modules\Project\Services\ProjectService;
use App\Modules\Media\Services\MediaService;
use Illuminate\Support\Facades\DB;
use Exception;
use App\Modules\Project\Models\Project;

class UpdateProjectUseCase
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly MediaService $mediaService
    ) {
    }

    /**
     * Executes the update of a project and its media.
     *
     * @param int $projectId
     * @param ProjectDTO $dto
     * @return Project
     * @throws Exception
     */
    public function execute(int $projectId, ProjectDTO $dto): Project
    {
        DB::beginTransaction();

        try {
            $project = $this->projectService->getProjectById($projectId);
            $this->projectService->updateProject($project, $dto->data);

            if ($dto->images && count($dto->images) > 0) {
                // Remove old images from DB (and potentially from storage if needed)
                $project->projectImages()->delete();
                $this->mediaService->processAndStoreProjectImages($project, $dto->images, 'projects', $dto->primaryImageIndex);
            } elseif ($dto->primaryImageId !== null) {
                // Set the selected existing image as primary, set all others to non-primary
                $project->projectImages()->update(['is_primary' => false]);
                $project->projectImages()->where('id', $dto->primaryImageId)->update(['is_primary' => true]);
            }

            // Update units
            $sentUnitIds = [];
            if ($dto->units && count($dto->units) > 0) {
                foreach ($dto->units as $index => $unitData) {
                    $unitId = $unitData['id'] ?? null;
                    
                    // Process new files uploaded for this unit position
                    $unitFiles = request()->file("unit_images_{$index}") ?: [];
                    $newPaths = [];
                    if (count($unitFiles) > 0) {
                        $newPaths = $this->mediaService->processAndStoreUnitFiles($unitFiles);
                    }

                    // Collect existing paths that the user decided to keep
                    $existingPaths = $unitData['existing_images'] ?? [];
                    if (is_string($existingPaths)) {
                        $existingPaths = json_decode($existingPaths, true) ?: [];
                    }

                    // Merge new paths with existing paths
                    $mergedPaths = array_merge($existingPaths, $newPaths);

                    $fields = [
                        'title_ar' => $unitData['title_ar'] ?? null,
                        'title_en' => $unitData['title_en'] ?? null,
                        'area' => $unitData['area'],
                        'price' => $unitData['price'] ?? null,
                        'bedrooms' => $unitData['bedrooms'] ?? null,
                        'bathrooms' => $unitData['bathrooms'] ?? null,
                        'description_ar' => $unitData['description_ar'] ?? null,
                        'description_en' => $unitData['description_en'] ?? null,
                        'image_paths' => $mergedPaths,
                        'sort_order' => $index
                    ];

                    if ($unitId) {
                        $project->projectUnits()->where('id', $unitId)->update($fields);
                        $sentUnitIds[] = $unitId;
                    } else {
                        $newUnit = $project->projectUnits()->create($fields);
                        $sentUnitIds[] = $newUnit->id;
                    }
                }
            }

            // Delete units that were not sent in the update
            $project->projectUnits()->whereNotIn('id', $sentUnitIds)->delete();

            if ($dto->featureIds !== null) {
                $project->features()->sync($dto->featureIds);
            }

            DB::commit();

            return $project->load(['projectImages', 'projectUnits', 'features']);
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
