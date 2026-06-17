<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SettingController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Setting::all());
    }

    #[OA\Get(
        path: "/public/settings",
        summary: "Get public website settings",
        tags: ["Public Settings"],
        responses: [
            new OA\Response(response: 200, description: "Successful operation")
        ]
    )]
    public function indexPublic()
    {
        return response()->json(\App\Models\Setting::all()->pluck('value', 'key'));
    }

    public function store(\App\Http\Requests\StoreSettingRequest $request)
    {
        $validated = $request->validated();

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

    public function update(\App\Http\Requests\UpdateSettingRequest $request, $id)
    {
        $setting = \App\Models\Setting::findOrFail($id);
        
        $validated = $request->validated();

        $setting->update($validated);
        return response()->json($setting);
    }

    public function destroy($id)
    {
        \App\Models\Setting::destroy($id);
        return response()->json(['message' => 'Deleted']);
    }
}
