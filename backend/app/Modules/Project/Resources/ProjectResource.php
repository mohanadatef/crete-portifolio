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
            'project_type_id' => $this->project_type_id,
            'project_type' => $this->whenLoaded('projectType', function () {
                return [
                    'id' => $this->projectType->id,
                    'name_ar' => $this->projectType->name_ar,
                    'name_en' => $this->projectType->name_en,
                    'slug' => $this->projectType->slug,
                ];
            }),
            'bedrooms' => $this->bedrooms,
            'delivery_date' => $this->delivery_date,
            'developer' => $this->developer,
            'views_count' => (int)($this->views_count ?? 0),
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
            'units' => $this->whenLoaded('projectUnits', function () {
                return $this->projectUnits->map(function ($unit) {
                    return [
                        'id' => $unit->id,
                        'title_ar' => $unit->title_ar,
                        'title_en' => $unit->title_en,
                        'area' => (float)$unit->area,
                        'price' => $unit->price !== null ? (float)$unit->price : null,
                        'bedrooms' => $unit->bedrooms,
                        'bathrooms' => $unit->bathrooms,
                        'description_ar' => $unit->description_ar,
                        'description_en' => $unit->description_en,
                        'image_paths' => $unit->image_paths ?: [],
                    ];
                });
            }),
            'features' => \App\Modules\Feature\Resources\FeatureResource::collection($this->whenLoaded('features')),
        ];
    }
}
