<?php

namespace App\Modules\Project\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Project extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'location',
        'location_ar',
        'status',
        'featured',
        'price',
        'area',
        'project_type_id',
        'bedrooms',
        'delivery_date',
        'developer',
        'views_count'
    ];

    protected $casts = [
        'status' => 'boolean',
        'featured' => 'boolean',
        'price' => 'decimal:2',
        'area' => 'decimal:2',
        'project_type_id' => 'integer',
        'bedrooms' => 'integer',
        'views_count' => 'integer',
        'delivery_date' => 'date'
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    public function projectImages()
    {
        return $this->hasMany(ProjectImage::class);
    }

    public function projectUnits()
    {
        return $this->hasMany(ProjectUnit::class)->orderBy('sort_order', 'asc');
    }

    public function projectType()
    {
        return $this->belongsTo(\App\Modules\ProjectType\Models\ProjectType::class, 'project_type_id');
    }

    public function features()
    {
        return $this->belongsToMany(\App\Modules\Feature\Models\Feature::class, 'project_feature');
    }
}
