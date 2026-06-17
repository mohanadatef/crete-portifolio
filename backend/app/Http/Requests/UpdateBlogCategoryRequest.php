<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogCategoryRequest extends FormRequest
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
        $id = $this->route('blog_category');
        return [
            'slug' => 'required|string|unique:blog_categories,slug,' . $id,
            'name_ar' => 'required|string',
            'name_en' => 'required|string'
        ];
    }
}
