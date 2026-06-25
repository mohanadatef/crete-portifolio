<?php

namespace App\Modules\Blog\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class BlogPost extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }
    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'content_ar',
        'content_en',
        'excerpt_ar',
        'excerpt_en',
        'image',
        'blog_category_id',
        'status',
        'views_count',
        'tags'
    ];

    public function category()
    {
        return $this->belongsTo(BlogCategory::class, 'blog_category_id');
    }
}
