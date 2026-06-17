<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BlogPost;
use OpenApi\Attributes as OA;

class BlogPostController extends Controller
{
    public function index()
    {
        return response()->json(BlogPost::with('category')->latest()->paginate(15));
    }

    #[OA\Get(
        path: "/public/blog/posts",
        summary: "Get public blog posts",
        tags: ["Public Blog"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic()
    {
        return response()->json(\App\Models\BlogPost::where('status', 1)->latest()->paginate(12));
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
    public function showPublic($slug)
    {
        $post = \App\Models\BlogPost::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($post);
    }

    public function store(\App\Http\Requests\StoreBlogPostRequest $request)
    {
        $validated = $request->validated();

        $post = \App\Models\BlogPost::create($validated);
        return response()->json($post, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\BlogPost::findOrFail($id));
    }

    public function update(\App\Http\Requests\UpdateBlogPostRequest $request, $id)
    {
        $post = \App\Models\BlogPost::findOrFail($id);
        
        $validated = $request->validated();

        $post->update($validated);
        return response()->json($post);
    }

    public function destroy($id)
    {
        \App\Models\BlogPost::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
