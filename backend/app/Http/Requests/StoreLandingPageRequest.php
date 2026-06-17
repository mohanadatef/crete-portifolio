<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLandingPageRequest extends FormRequest
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
        return [
            'slug' => 'required|string|unique:landing_pages,slug',
            'title_ar' => 'required|string',
            'title_en' => 'required|string',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'status' => 'boolean'
        ];
    }
}
