<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class PageController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Page::latest()->get());
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
    public function showPublic($slug)
    {
        $page = \App\Models\Page::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($page);
    }

    public function store(\App\Http\Requests\StorePageRequest $request)
    {
        $validated = $request->validated();

        $page = \App\Models\Page::create($validated);
        return response()->json($page, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Page::findOrFail($id));
    }

    public function update(\App\Http\Requests\UpdatePageRequest $request, $id)
    {
        $page = \App\Models\Page::findOrFail($id);
        
        $validated = $request->validated();

        $page->update($validated);
        return response()->json($page);
    }

    public function destroy($id)
    {
        \App\Models\Page::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
