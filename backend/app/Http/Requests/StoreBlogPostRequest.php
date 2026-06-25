<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBlogPostRequest extends FormRequest
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
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'slug' => 'required|string|unique:blog_posts,slug',
            'title_ar' => 'required|string',
            'title_en' => 'required|string',
            'content_ar' => 'nullable|string',
            'content_en' => 'nullable|string',
            'image' => 'nullable|string',
            'status' => 'boolean',
            'tags' => 'nullable|string'
        ];
    }
}
