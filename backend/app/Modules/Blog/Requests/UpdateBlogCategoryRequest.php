<?php

namespace App\Modules\Blog\Requests;

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
        $blogCategory = $this->route('blog_category');
        $id = is_object($blogCategory) ? $blogCategory->id : $blogCategory;
        
        return [
            'slug' => 'nullable|string|unique:blog_categories,slug,' . $id,
            'name_ar' => 'required|string',
            'name_en' => 'required|string',
            'status' => 'boolean'
        ];
    }
}
