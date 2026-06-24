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

class ProjectTypeController extends Controller
{
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

        return response()->json([
            'status' => 'success',
            'data' => ProjectTypeResource::collection($projectTypes)->response()->getData(true)
        ]);
    }

    public function active(): JsonResponse
    {
        $projectTypes = $this->projectTypeService->getActiveProjectTypes();
        return response()->json([
            'status' => 'success',
            'data' => ProjectTypeResource::collection($projectTypes)
        ]);
    }

    public function store(StoreProjectTypeRequest $request): JsonResponse
    {
        $dto = ProjectTypeDTO::fromRequest($request->validated());
        $projectType = $this->projectTypeService->createProjectType($dto->data);

        return response()->json([
            'status' => 'success',
            'message' => 'Project Type created successfully',
            'data' => new ProjectTypeResource($projectType)
        ], 201);
    }

    public function show(ProjectType $projectType): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => new ProjectTypeResource($projectType)
        ]);
    }

    public function update(UpdateProjectTypeRequest $request, ProjectType $projectType): JsonResponse
    {
        $dto = ProjectTypeDTO::fromRequest($request->validated());
        $projectType = $this->projectTypeService->updateProjectType($projectType, $dto->data);

        return response()->json([
            'status' => 'success',
            'message' => 'Project Type updated successfully',
            'data' => new ProjectTypeResource($projectType)
        ]);
    }

    public function destroy(ProjectType $projectType): JsonResponse
    {
        try {
            $this->projectTypeService->deleteProjectType($projectType);
            return response()->json([
                'status' => 'success',
                'message' => 'Project Type deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
