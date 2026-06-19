<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLandingPageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $id = $this->route('landing_page'); // check route param name in routes/api.php
        return [
            'slug' => 'required|string|unique:landing_pages,slug,' . $id,
            'title_ar' => 'required|string',
            'title_en' => 'required|string',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'status' => 'boolean',
            'project_id' => 'nullable|exists:projects,id',
            'layout' => 'nullable|array',
            'form_schema' => 'nullable|array'
        ];
    }
}
