<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Project::query();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title_en', 'like', '%' . $request->search . '%')
                  ->orWhere('title_ar', 'like', '%' . $request->search . '%');
            });
        }

        return response()->json($query->latest()->paginate(15));
    }

    #[OA\Get(
        path: "/public/projects",
        summary: "Get list of published projects",
        tags: ["Public Projects"],
        parameters: [
            new OA\Parameter(name: "type", in: "query", required: false, description: "Project type filter", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "min_price", in: "query", required: false, description: "Minimum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "max_price", in: "query", required: false, description: "Maximum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "bedrooms", in: "query", required: false, description: "Number of bedrooms", schema: new OA\Schema(type: "integer"))
        ],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic(Request $request)
    {
        $query = \App\Models\Project::where('status', 1);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', $request->bedrooms);
        }

        return response()->json($query->paginate(12));
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
    public function showPublic($slug)
    {
        $project = \App\Models\Project::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($project);
    }

    public function store(\App\Http\Requests\StoreProjectRequest $request)
    {
        $validated = $request->validated();

        $project = \App\Models\Project::create($validated);

        if ($request->hasFile('images')) {
            $this->processAndStoreImages($project, $request->file('images'));
        }
        return response()->json($project, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Project::findOrFail($id));
    }

    public function update(\App\Http\Requests\UpdateProjectRequest $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        
        $validated = $request->validated();

        $project->update($validated);

        if ($request->hasFile('images')) {
            $project->projectImages()->delete();
            $this->processAndStoreImages($project, $request->file('images'));
        }
        return response()->json($project);
    }

    private function processAndStoreImages($project, $files)
    {
        $manager = new \Intervention\Image\ImageManager(new \Intervention\Image\Drivers\Gd\Driver());
        foreach ($files as $index => $file) {
            $filename = uniqid('project_') . '_' . time();
            
            // Main image
            $image = $manager->read($file->getRealPath());
            $image->scaleDown(width: 1920);
            $encoded = $image->toWebp(75);
            \Illuminate\Support\Facades\Storage::disk('public')->put('projects/' . $filename . '.webp', $encoded->toString());

            // Thumbnail
            $thumb = $manager->read($file->getRealPath());
            $thumb->coverDown(width: 600, height: 400);
            $encodedThumb = $thumb->toWebp(70);
            \Illuminate\Support\Facades\Storage::disk('public')->put('projects/' . $filename . '_thumb.webp', $encodedThumb->toString());

            $project->projectImages()->create([
                'image_path' => '/storage/projects/' . $filename . '.webp',
                'is_primary' => $index === 0
            ]);
        }
    }

    public function destroy($id)
    {
        \App\Models\Project::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
