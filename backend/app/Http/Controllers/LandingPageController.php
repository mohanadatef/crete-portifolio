<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class LandingPageController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\LandingPage::latest()->paginate(15));
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
    public function showPublic($slug)
    {
        $page = \App\Models\LandingPage::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($page);
    }

    public function store(\App\Http\Requests\StoreLandingPageRequest $request)
    {
        $validated = $request->validated();

        $page = \App\Models\LandingPage::create($validated);
        return response()->json($page, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\LandingPage::findOrFail($id));
    }

    public function update(\App\Http\Requests\UpdateLandingPageRequest $request, $id)
    {
        $page = \App\Models\LandingPage::findOrFail($id);
        
        $validated = $request->validated();

        $page->update($validated);
        return response()->json($page);
    }

    public function destroy($id)
    {
        \App\Models\LandingPage::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
