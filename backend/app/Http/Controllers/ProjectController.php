<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Project::latest()->get());
    }

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

    public function showPublic($slug)
    {
        $project = \App\Models\Project::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($project);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|unique:projects,slug',
            'title_ar' => 'required',
            'title_en' => 'required',
            'description_ar' => 'nullable',
            'description_en' => 'nullable',
            'location' => 'nullable',
            'status' => 'boolean',
            'featured' => 'boolean',
            'images' => 'nullable|array'
        ]);

        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $file) {
                $path = $file->store('projects', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
            $validated['images'] = $imagePaths;
        }

        $project = \App\Models\Project::create($validated);
        return response()->json($project, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Project::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $project = \App\Models\Project::findOrFail($id);
        
        $validated = $request->validate([
            'slug' => 'required|unique:projects,slug,' . $id,
            'title_ar' => 'required',
            'title_en' => 'required',
            'description_ar' => 'nullable',
            'description_en' => 'nullable',
            'location' => 'nullable',
            'status' => 'boolean',
            'featured' => 'boolean',
            'images' => 'nullable|array'
        ]);

        if ($request->hasFile('images')) {
            $imagePaths = [];
            foreach ($request->file('images') as $file) {
                $path = $file->store('projects', 'public');
                $imagePaths[] = '/storage/' . $path;
            }
            $validated['images'] = $imagePaths;
        }

        $project->update($validated);
        return response()->json($project);
    }

    public function destroy($id)
    {
        \App\Models\Project::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
