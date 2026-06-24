<?php

namespace App\Modules\Project\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Project\DTOs\ProjectDTO;
use App\Modules\Project\DTOs\ProjectFilterDTO;
use App\Modules\Project\Services\ProjectService;
use App\Modules\Project\Actions\StoreProjectUseCase;
use App\Modules\Project\Actions\UpdateProjectUseCase;
use App\Modules\Project\Resources\ProjectResource;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use Exception;
use OpenApi\Attributes as OA;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projectService)
    {
        $this->middleware('permission:view-projects')->only(['index', 'show']);
        $this->middleware('permission:create-projects')->only(['store']);
        $this->middleware('permission:edit-projects')->only(['update']);
        $this->middleware('permission:delete-projects')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $filter = ProjectFilterDTO::fromRequest($request);
            $projects = $this->projectService->getProjects($filter);
            
            // For pagination, we can use Laravel's resource collection
            return $this->successResponse(
                ProjectResource::collection($projects)->response()->getData(true),
                'Projects retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/projects",
        summary: "Get list of published projects",
        tags: ["Public Projects"],
        parameters: [
            new OA\Parameter(name: "type", in: "query", required: false, description: "Project type filter", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "location", in: "query", required: false, description: "Project location", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "min_price", in: "query", required: false, description: "Minimum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "max_price", in: "query", required: false, description: "Maximum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "bedrooms", in: "query", required: false, description: "Number of bedrooms", schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic(Request $request): JsonResponse
    {
        try {
            $filter = ProjectFilterDTO::fromRequest($request);
            // Pass onlyPublished = true
            $projects = $this->projectService->getProjects($filter, 12, true);
            
            return $this->successResponse(
                ProjectResource::collection($projects)->response()->getData(true),
                'Projects retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/projects/{slug}",
        summary: "Get a specific project by slug",
        tags: ["Public Projects"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Project slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation"),
            new OA\Response(response: 404, description: "Project not found")
        ]
    )]
    public function showPublic(string $slug): JsonResponse
    {
        try {
            $project = $this->projectService->getProjectBySlug($slug);
            $project->increment('views_count');
            $project->load(['projectImages', 'projectUnits']);
            return $this->successResponse(new ProjectResource($project), 'Project retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Project not found', 404);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $project = $this->projectService->getProjectById($id);
            $project->load(['projectImages', 'projectUnits']);
            return $this->successResponse(new ProjectResource($project), 'Project retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Project not found', 404);
        }
    }

    public function store(StoreProjectRequest $request, StoreProjectUseCase $useCase): JsonResponse
    {
        try {
            // Validate via FormRequest, but map via DTO
            $dto = ProjectDTO::fromRequest($request);
            $project = $useCase->execute($dto);
            
            return $this->successResponse(new ProjectResource($project), 'Project created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function update(UpdateProjectRequest $request, int $id, UpdateProjectUseCase $useCase): JsonResponse
    {
        try {
            $dto = ProjectDTO::fromRequest($request);
            $project = $useCase->execute($id, $dto);
            
            return $this->successResponse(new ProjectResource($project), 'Project updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->projectService->deleteProject($id);
            return $this->successResponse(null, 'Deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete project', 500);
        }
    }
}
