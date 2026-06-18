<?php

namespace App\Modules\Blog\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Blog\DTOs\BlogCategoryDTO;
use App\Services\BlogService;
use App\Modules\Blog\Resources\BlogCategoryResource;
use App\Http\Requests\StoreBlogCategoryRequest;
use App\Http\Requests\UpdateBlogCategoryRequest;
use Exception;
use OpenApi\Attributes as OA;

class BlogCategoryController extends Controller
{
    public function __construct(private readonly BlogService $blogService)
    {
    }

    public function index(): JsonResponse
    {
        try {
            $categories = $this->blogService->getCategoriesPaginator(15);
            return $this->successResponse(
                BlogCategoryResource::collection($categories)->response()->getData(true),
                'Categories retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/blog/categories",
        summary: "Get public blog categories",
        tags: ["Public Blog"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic(): JsonResponse
    {
        try {
            $categories = $this->blogService->getAllCategories();
            return $this->successResponse(
                BlogCategoryResource::collection($categories),
                'Categories retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function store(StoreBlogCategoryRequest $request): JsonResponse
    {
        try {
            $dto = BlogCategoryDTO::fromRequest($request);
            $category = $this->blogService->createCategory($dto->data);
            return $this->successResponse(new BlogCategoryResource($category), 'Category created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $category = $this->blogService->getCategoryById($id);
            return $this->successResponse(new BlogCategoryResource($category), 'Category retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Category not found', 404);
        }
    }

    public function update(UpdateBlogCategoryRequest $request, int $id): JsonResponse
    {
        try {
            $dto = BlogCategoryDTO::fromRequest($request);
            $category = $this->blogService->updateCategory($id, $dto->data);
            return $this->successResponse(new BlogCategoryResource($category), 'Category updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->blogService->deleteCategory($id);
            return $this->successResponse(null, 'Category deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete category', 500);
        }
    }
}
