<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BlogCategoryController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\BlogCategory::latest()->get());
    }

    public function indexPublic()
    {
        return response()->json(\App\Models\BlogCategory::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|unique:blog_categories,slug',
            'name_ar' => 'required',
            'name_en' => 'required'
        ]);

        $category = \App\Models\BlogCategory::create($validated);
        return response()->json($category, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\BlogCategory::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $category = \App\Models\BlogCategory::findOrFail($id);
        
        $validated = $request->validate([
            'slug' => 'required|unique:blog_categories,slug,' . $id,
            'name_ar' => 'required',
            'name_en' => 'required'
        ]);

        $category->update($validated);
        return response()->json($category);
    }

    public function destroy($id)
    {
        \App\Models\BlogCategory::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
