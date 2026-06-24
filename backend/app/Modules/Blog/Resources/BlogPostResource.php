<?php

namespace App\Modules\Blog\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BlogPostResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'slug' => $this->slug,
            'content_ar' => $this->content_ar,
            'content_en' => $this->content_en,
            'image' => $this->image,
            'status' => (bool)$this->status,
            'blog_category_id' => $this->blog_category_id,
            'category_id' => $this->blog_category_id,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'category' => new BlogCategoryResource($this->whenLoaded('category')),
        ];
    }
}
