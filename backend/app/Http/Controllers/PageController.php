<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PageController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Page::latest()->get());
    }

    public function showPublic($slug)
    {
        $page = \App\Models\Page::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($page);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|unique:pages,slug',
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'meta_fields' => 'nullable|array',
            'status' => 'boolean'
        ]);

        $page = \App\Models\Page::create($validated);
        return response()->json($page, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Page::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $page = \App\Models\Page::findOrFail($id);
        
        $validated = $request->validate([
            'slug' => 'required|unique:pages,slug,' . $id,
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'meta_fields' => 'nullable|array',
            'status' => 'boolean'
        ]);

        $page->update($validated);
        return response()->json($page);
    }

    public function destroy($id)
    {
        \App\Models\Page::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
