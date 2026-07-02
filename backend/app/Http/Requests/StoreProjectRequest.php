<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => 'required|unique:projects,slug',
            'title_ar' => 'required',
            'title_en' => 'required',
            'description_ar' => 'nullable',
            'description_en' => 'nullable',
            'location' => 'nullable',
            'location_ar' => 'nullable|string',
            'status' => 'boolean',
            'featured' => 'boolean',
            'price' => 'nullable|numeric',
            'area' => 'nullable|numeric',
            'project_type_id' => 'nullable|exists:project_types,id',
            'bedrooms' => 'nullable|numeric',
            'delivery_date' => 'nullable|date',
            'developer' => 'nullable|string',
            'images' => 'required|array|min:1',
            'images.*' => 'file|mimes:jpg,jpeg,png,webp,mp4,webm,ogg,mov|max:20480',
            'primary_image_index' => 'nullable|integer',
            'units' => 'nullable|array',
            'units.*.title_ar' => 'nullable|string',
            'units.*.title_en' => 'nullable|string',
            'units.*.area' => 'required|numeric',
            'units.*.price' => 'nullable|numeric',
            'units.*.bedrooms' => 'nullable|integer',
            'units.*.bathrooms' => 'nullable|integer',
            'units.*.description_ar' => 'nullable|string',
            'units.*.description_en' => 'nullable|string'
        ];
    }
}
