<?php

namespace App\Modules\Blog\Controllers;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use Illuminate\Http\JsonResponse;
use App\Modules\Blog\DTOs\BlogPostDTO;
use App\Services\BlogService;
use App\Modules\Blog\Resources\BlogPostResource;
use App\Http\Requests\StoreBlogPostRequest;
use App\Http\Requests\UpdateBlogPostRequest;
use Exception;
use OpenApi\Attributes as OA;

class BlogPostController extends Controller
{
    public function __construct(private readonly BlogService $blogService)
    {
        $this->middleware('permission:view-blog-posts')->only(['index', 'show']);
        $this->middleware('permission:create-blog-posts')->only(['store']);
        $this->middleware('permission:edit-blog-posts')->only(['update']);
        $this->middleware('permission:delete-blog-posts')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->integer('per_page', 15);
            if ($perPage < 1 || $perPage > 100) {
                $perPage = 15;
            }
            $search = $request->input('search');
            $status = $request->input('status');

            $posts = $this->blogService->getPostsPaginator($perPage, false, $search, $status);
            return $this->successResponse(
                BlogPostResource::collection($posts)->response()->getData(true),
                'Posts retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/blog/posts",
        summary: "Get public blog posts",
        tags: ["Public Blog"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic(Request $request): JsonResponse
    {
        try {
            $perPage = $request->integer('per_page', 12);
            if ($perPage < 1 || $perPage > 100) {
                $perPage = 12;
            }
            $search = $request->input('search');

            $posts = $this->blogService->getPostsPaginator($perPage, true, $search);
            return $this->successResponse(
                BlogPostResource::collection($posts)->response()->getData(true),
                'Posts retrieved successfully'
            );
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    #[OA\Get(
        path: "/public/blog/posts/{slug}",
        summary: "Get a specific blog post by slug",
        tags: ["Public Blog"],
        parameters: [
            new OA\Parameter(name: "slug", in: "path", required: true, description: "Blog post slug", schema: new OA\Schema(type: "string"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation"),
            new OA\Response(response: 404, description: "Blog post not found")
        ]
    )]
    public function showPublic(string $slug): JsonResponse
    {
        try {
            $post = $this->blogService->getPostBySlug($slug);
            $post->increment('views_count');
            return $this->successResponse(new BlogPostResource($post), 'Post retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Blog post not found', 404);
        }
    }

    public function store(StoreBlogPostRequest $request): JsonResponse
    {
        try {
            $dto = BlogPostDTO::fromRequest($request);
            $post = $this->blogService->createPost($dto->data);
            return $this->successResponse(new BlogPostResource($post), 'Post created successfully', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $post = $this->blogService->getPostById($id);
            return $this->successResponse(new BlogPostResource($post), 'Post retrieved successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Post not found', 404);
        }
    }

    public function update(UpdateBlogPostRequest $request, int $id): JsonResponse
    {
        try {
            $dto = BlogPostDTO::fromRequest($request);
            $post = $this->blogService->updatePost($id, $dto->data);
            return $this->successResponse(new BlogPostResource($post), 'Post updated successfully');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->blogService->deletePost($id);
            return $this->successResponse(null, 'Post deleted successfully');
        } catch (Exception $e) {
            return $this->errorResponse('Failed to delete post', 500);
        }
    }
}
