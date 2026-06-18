<?php

namespace App\Modules\Project\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
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
            'slug' => $this->slug,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'location' => $this->location,
            'status' => (bool)$this->status,
            'featured' => (bool)$this->featured,
            'price' => $this->price,
            'area' => $this->area,
            'type' => $this->type,
            'bedrooms' => $this->bedrooms,
            'delivery_date' => $this->delivery_date,
            'developer' => $this->developer,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'images' => $this->whenLoaded('projectImages', function () {
                return $this->projectImages->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => $image->image_path,
                        'is_primary' => (bool)$image->is_primary,
                    ];
                });
            }),
        ];
    }
}
