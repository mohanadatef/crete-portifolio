<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Project extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'description_ar',
        'description_en',
        'location',
        'status',
        'featured',
        'price',
        'area',
        'type',
        'bedrooms',
        'delivery_date',
        'developer'
    ];

    protected $appends = ['images'];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }

    public function getImagesAttribute()
    {
        return $this->projectImages()->pluck('image_path');
    }

    public function projectImages()
    {
        return $this->hasMany(ProjectImage::class);
    }
}
