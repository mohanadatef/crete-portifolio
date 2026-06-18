<?php

namespace App\Modules\Page\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Page\DTOs\PageDTO;
use App\Modules\Page\Services\PageService;
use App\Modules\Page\Resources\PageResource;
use App\Http\Requests\StorePageRequest;
use App\Http\Requests\UpdatePageRequest;
use Exception;
use OpenApi\Attributes as OA;

class PageController extends Controller
{
    public function __construct(private readonly PageService $pageService)
    {
    }

    public function index(): JsonResponse
    {
        try {
            $pages = $this->pageService->getAllPages();
            return $this->successResponse(
                PageResource::collection($pages),
                'Pages retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/pages/{slug}",
        summary: "Get a specific page by slug",
        tags: ["Public Pages"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Page slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation"),
            new OA\Response(response: 404, description: "Page not found")
        ]
    )]
    public function showPublic(string $slug): JsonResponse
    {
        try {
            $page = $this->pageService->getPageBySlug($slug);
            return $this->successResponse(new PageResource($page), 'Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Page not found', 404);
        }
    }

    public function store(StorePageRequest $request): JsonResponse
    {
        try {
            $dto = PageDTO::fromRequest($request);
            $page = $this->pageService->createPage($dto->data);
            return $this->successResponse(new PageResource($page), 'Page created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $page = $this->pageService->getPageById($id);
            return $this->successResponse(new PageResource($page), 'Page retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Page not found', 404);
        }
    }

    public function update(UpdatePageRequest $request, int $id): JsonResponse
    {
        try {
            $dto = PageDTO::fromRequest($request);
            $page = $this->pageService->updatePage($id, $dto->data);
            return $this->successResponse(new PageResource($page), 'Page updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->pageService->deletePage($id);
            return $this->successResponse(null, 'Page deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete page', 500);
        }
    }
}
