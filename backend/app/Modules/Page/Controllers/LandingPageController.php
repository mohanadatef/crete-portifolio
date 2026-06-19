<?php

namespace App\Modules\Page\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Page\DTOs\LandingPageDTO;
use App\Modules\Page\Services\PageService;
use App\Modules\Page\Resources\LandingPageResource;
use App\Http\Requests\StoreLandingPageRequest;
use App\Http\Requests\UpdateLandingPageRequest;
use Exception;
use OpenApi\Attributes as OA;

class LandingPageController extends Controller
{
    public function __construct(private readonly PageService $pageService)
    {
        $this->middleware('permission:view-landing-pages')->only(['index', 'show']);
        $this->middleware('permission:create-landing-pages')->only(['store']);
        $this->middleware('permission:edit-landing-pages')->only(['update']);
        $this->middleware('permission:delete-landing-pages')->only(['destroy']);
    }

    public function index(): JsonResponse
    {
        try {
            $pages = $this->pageService->getLandingPagesPaginator(15);
            return $this->successResponse(
                LandingPageResource::collection($pages)->response()->getData(true),
                'Landing Pages retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/landing-pages/{slug}",
        summary: "Get a specific landing page by slug",
        tags: ["Public Landing Pages"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Landing page slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation"),
            new OA\Response(response: 404, description: "Landing Page not found")
        ]
    )]
    public function showPublic(string $slug): JsonResponse
    {
        try {
            $page = $this->pageService->getLandingPageBySlug($slug);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Landing Page not found', 404);
        }
    }

    public function store(StoreLandingPageRequest $request): JsonResponse
    {
        try {
            $dto = LandingPageDTO::fromRequest($request);
            $page = $this->pageService->createLandingPage($dto->data);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $page = $this->pageService->getLandingPageById($id);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Landing Page not found', 404);
        }
    }

    public function update(UpdateLandingPageRequest $request, int $id): JsonResponse
    {
        try {
            $dto = LandingPageDTO::fromRequest($request);
            $page = $this->pageService->updateLandingPage($id, $dto->data);
            return $this->successResponse(new LandingPageResource($page), 'Landing Page updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->pageService->deleteLandingPage($id);
            return $this->successResponse(null, 'Landing Page deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete landing page', 500);
        }
    }
}
