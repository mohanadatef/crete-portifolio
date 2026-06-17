<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePageRequest extends FormRequest
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
            'slug' => 'required|string|unique:pages,slug',
            'title_ar' => 'required|string',
            'title_en' => 'required|string',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'meta_fields' => 'nullable|array',
            'status' => 'boolean'
        ];
    }
}
