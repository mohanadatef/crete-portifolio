<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Lead::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required',
            'email' => 'nullable|email',
            'phone' => 'required',
            'message' => 'nullable',
            'source' => 'nullable',
        ]);

        $lead = \App\Models\Lead::create($validated);
        return response()->json(['message' => 'Lead submitted successfully', 'lead' => $lead], 201);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Lead::findOrFail($id));
    }

    public function destroy($id)
    {
        \App\Models\Lead::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
