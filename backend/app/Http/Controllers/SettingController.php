<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Setting::all());
    }

    public function indexPublic()
    {
        return response()->json(\App\Models\Setting::all()->pluck('value', 'key'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|unique:settings,key',
            'value' => 'nullable'
        ]);

        $setting = \App\Models\Setting::create($validated);
        return response()->json($setting, 201);
    }

    public function updateBulk(Request $request)
    {
        $settings = $request->all();
        foreach ($settings as $key => $value) {
            \App\Models\Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
        return response()->json(['message' => 'Settings updated successfully']);
    }

    public function show($id)
    {
        return response()->json(\App\Models\Setting::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $setting = \App\Models\Setting::findOrFail($id);
        
        $validated = $request->validate([
            'key' => 'required|unique:settings,key,' . $id,
            'value' => 'nullable'
        ]);

        $setting->update($validated);
        return response()->json($setting);
    }

    public function destroy($id)
    {
        \App\Models\Setting::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
