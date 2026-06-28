<?php

namespace App\Modules\Project\Actions;

use App\Modules\Project\DTOs\ProjectDTO;
use App\Modules\Project\Services\ProjectService;
use App\Modules\Media\Services\MediaService;
use Illuminate\Support\Facades\DB;
use Exception;
use App\Modules\Project\Models\Project;

class StoreProjectUseCase
{
    public function __construct(
        private readonly ProjectService $projectService,
        private readonly MediaService $mediaService
    ) {
    }

    /**
     * Executes the creation of a project and its media.
     *
     * @param ProjectDTO $dto
     * @return Project
     * @throws Exception
     */
    public function execute(ProjectDTO $dto): Project
    {
        DB::beginTransaction();

        try {
            $project = $this->projectService->createProject($dto->data);

            if ($dto->images && count($dto->images) > 0) {
                $this->mediaService->processAndStoreProjectImages($project, $dto->images, 'projects', $dto->primaryImageIndex);
            }

            if ($dto->units && count($dto->units) > 0) {
                foreach ($dto->units as $index => $unitData) {
                    $unitFiles = request()->file("unit_images_{$index}") ?: [];
                    $paths = [];
                    if (count($unitFiles) > 0) {
                        $paths = $this->mediaService->processAndStoreUnitFiles($unitFiles);
                    }
                    $project->projectUnits()->create([
                        'title_ar' => $unitData['title_ar'] ?? null,
                        'title_en' => $unitData['title_en'] ?? null,
                        'area' => $unitData['area'],
                        'price' => $unitData['price'] ?? null,
                        'bedrooms' => $unitData['bedrooms'] ?? null,
                        'bathrooms' => $unitData['bathrooms'] ?? null,
                        'description_ar' => $unitData['description_ar'] ?? null,
                        'description_en' => $unitData['description_en'] ?? null,
                        'image_paths' => $paths,
                        'sort_order' => $index
                    ]);
                }
            }

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
