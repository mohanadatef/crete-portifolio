<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $path = $request->file('image')->store('media', 'public');

        // Optional: Save to media table if you use one
        // Media::create(['path' => $path]);

        return response()->json([
            'url' => asset("storage/{$path}"),
            'path' => $path
        ]);
    }
}
