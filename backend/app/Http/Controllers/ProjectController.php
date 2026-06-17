<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Project::latest()->get());
    }

    public function indexPublic()
    {
        return response()->json(\App\Models\Project::where('status', 1)->latest()->get());
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

        $project->update($validated);
        return response()->json($project);
    }

    public function destroy($id)
    {
        \App\Models\Project::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
