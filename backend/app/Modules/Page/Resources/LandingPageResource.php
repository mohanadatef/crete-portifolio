<?php

namespace App\Modules\Page\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LandingPageResource extends JsonResource
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
            'template' => $this->template,
            'status' => (bool)$this->status,
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'project_id' => $this->project_id,
            'project' => $this->whenLoaded('project'),
            'layout' => $this->layout,
            'form_schema' => $this->form_schema,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
