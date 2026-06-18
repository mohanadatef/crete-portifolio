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
                $this->mediaService->processAndStoreProjectImages($project, $dto->images);
            }

            DB::commit();

            return $project->load('projectImages');
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
