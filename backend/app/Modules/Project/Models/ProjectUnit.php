<?php

namespace App\Modules\Project\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title_ar',
        'title_en',
        'area',
        'price',
        'bedrooms',
        'bathrooms',
        'description_ar',
        'description_en',
        'image_paths',
        'sort_order'
    ];

    protected $casts = [
        'image_paths' => 'array'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
