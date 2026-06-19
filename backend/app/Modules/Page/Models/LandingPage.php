<?php

namespace App\Modules\Page\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use App\Modules\Project\Models\Project;
use App\Modules\Lead\Models\Lead;

class LandingPage extends Model implements HasMedia
{
    use HasFactory, LogsActivity, InteractsWithMedia;

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
        'status',
        'project_id',
        'layout',
        'form_schema'
    ];

    protected $casts = [
        'layout' => 'array',
        'form_schema' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }
}
