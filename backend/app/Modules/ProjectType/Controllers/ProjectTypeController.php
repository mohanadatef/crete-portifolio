<?php

namespace App\Modules\ProjectType\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ProjectType\DTOs\ProjectTypeDTO;
use App\Modules\ProjectType\Requests\StoreProjectTypeRequest;
use App\Modules\ProjectType\Requests\UpdateProjectTypeRequest;
use App\Modules\ProjectType\Resources\ProjectTypeResource;
use App\Modules\ProjectType\Services\ProjectTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Modules\ProjectType\Models\ProjectType;
use App\Traits\ApiResponseTrait;

class ProjectTypeController extends Controller
{
    use ApiResponseTrait;
    public function __construct(private readonly ProjectTypeService $projectTypeService)
    {
        $this->middleware('permission:view-project-types')->only(['index', 'show']);
        $this->middleware('permission:create-project-types')->only(['store']);
        $this->middleware('permission:edit-project-types')->only(['update']);
        $this->middleware('permission:delete-project-types')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $projectTypes = $this->projectTypeService->getProjectTypes(
            $request->input('per_page', 10),
            $request->input('search'),
            $request->input('status')
        );

        return $this->successResponse(
            ProjectTypeResource::collection($projectTypes)->response()->getData(true),
            'Project types retrieved successfully'
        );
    }

    public function active(): JsonResponse
    {
        $projectTypes = $this->projectTypeService->getActiveProjectTypes();
        return $this->successResponse(
            ProjectTypeResource::collection($projectTypes),
            'Active project types retrieved successfully'
        );
    }

    public function store(StoreProjectTypeRequest $request): JsonResponse
    {
        $dto = ProjectTypeDTO::fromRequest($request->validated());
        $projectType = $this->projectTypeService->createProjectType($dto->data);

        return $this->successResponse(
            new ProjectTypeResource($projectType),
            'Project Type created successfully',
            201
        );
    }

    public function show(ProjectType $projectType): JsonResponse
    {
        return $this->successResponse(
            new ProjectTypeResource($projectType),
            'Project type retrieved successfully'
        );
    }

    public function update(UpdateProjectTypeRequest $request, ProjectType $projectType): JsonResponse
    {
        $dto = ProjectTypeDTO::fromRequest($request->validated());
        $projectType = $this->projectTypeService->updateProjectType($projectType, $dto->data);

        return $this->successResponse(
            new ProjectTypeResource($projectType),
            'Project Type updated successfully'
        );
    }

    public function destroy(ProjectType $projectType): JsonResponse
    {
        try {
            $this->projectTypeService->deleteProjectType($projectType);
            return $this->successResponse(null, 'Project Type deleted successfully');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('ProjectTypeController@destroy: ' . $e->getMessage(), ['exception' => $e]);
            return $this->errorResponse('Failed to delete project type.', 500);
        }
    }
}
