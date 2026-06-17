<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class BlogCategoryController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\BlogCategory::latest()->paginate(15));
    }

    #[OA\Get(
        path: "/public/blog/categories",
        summary: "Get public blog categories",
        tags: ["Public Blog"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic()
    {
        return response()->json(\App\Models\BlogCategory::latest()->get());
    }

    public function store(\App\Http\Requests\StoreBlogCategoryRequest $request)
    {
        $validated = $request->validated();

        $category = \App\Models\BlogCategory::create($validated);
        return response()->json($category, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\BlogCategory::findOrFail($id));
    }

    public function update(\App\Http\Requests\UpdateBlogCategoryRequest $request, $id)
    {
        $category = \App\Models\BlogCategory::findOrFail($id);
        
        $validated = $request->validated();

        $category->update($validated);
        return response()->json($category);
    }

    public function destroy($id)
    {
        \App\Models\BlogCategory::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
