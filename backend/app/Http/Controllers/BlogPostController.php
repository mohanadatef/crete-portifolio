<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class BlogPostController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\BlogPost::latest()->get());
    }

    public function indexPublic()
    {
        return response()->json(\App\Models\BlogPost::where('status', 1)->latest()->get());
    }

    public function showPublic($slug)
    {
        $post = \App\Models\BlogPost::where('slug', $slug)->where('status', 1)->firstOrFail();
        return response()->json($post);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'slug' => 'required|unique:blog_posts,slug',
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'image' => 'nullable',
            'status' => 'boolean'
        ]);

        $post = \App\Models\BlogPost::create($validated);
        return response()->json($post, 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\BlogPost::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $post = \App\Models\BlogPost::findOrFail($id);
        
        $validated = $request->validate([
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'slug' => 'required|unique:blog_posts,slug,' . $id,
            'title_ar' => 'required',
            'title_en' => 'required',
            'content_ar' => 'nullable',
            'content_en' => 'nullable',
            'image' => 'nullable',
            'status' => 'boolean'
        ]);

        $post->update($validated);
        return response()->json($post);
    }

    public function destroy($id)
    {
        \App\Models\BlogPost::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
