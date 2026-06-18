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
            'status' => 'boolean',
            'featured' => 'boolean',
            'price' => 'nullable|numeric',
            'area' => 'nullable|numeric',
            'project_type_id' => 'nullable|exists:project_types,id',
            'bedrooms' => 'nullable|numeric',
            'delivery_date' => 'nullable|date',
            'developer' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096'
        ];
    }
}
