<?php

namespace App\Modules\Blog\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBlogPostRequest extends FormRequest
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
        // For resource route, the parameter is usually 'blog_post' model or id
        $blogPost = $this->route('blog_post');
        $id = is_object($blogPost) ? $blogPost->id : $blogPost;
        
        return [
            'blog_category_id' => 'nullable|exists:blog_categories,id',
            'slug' => 'required|string|unique:blog_posts,slug,' . $id,
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
