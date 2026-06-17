<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LandingPageController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\LandingPage::latest()->get());
    }

    public function showPublic($slug)
    {
        $page = \App\Models\LandingPage::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($page);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|unique:landing_pages,slug',
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'status' => 'boolean'
        ]);

        $page = \App\Models\LandingPage::create($validated);
        return response()->json($page, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\LandingPage::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $page = \App\Models\LandingPage::findOrFail($id);
        
        $validated = $request->validate([
            'slug' => 'required|unique:landing_pages,slug,' . $id,
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'status' => 'boolean'
        ]);

        $page->update($validated);
        return response()->json($page);
    }

    public function destroy($id)
    {
        \App\Models\LandingPage::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
