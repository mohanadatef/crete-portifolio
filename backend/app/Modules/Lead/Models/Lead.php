<?php

namespace App\Modules\Lead\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;
use App\Modules\Page\Models\LandingPage;
use App\Modules\Project\Models\Project;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Lead extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()
            ->logOnlyDirty();
    }
    
    protected $fillable = [
        'name',
        'email',
        'phone',
        'message',
        'project_id',
        'status',
        'assigned_to',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'landing_page_id',
        'form_data'
    ];

    protected $casts = [
        'form_data' => 'array'
    ];

    public function landingPage()
    {
        return $this->belongsTo(LandingPage::class);
    }

    public function project()
    {
        return $this->belongsTo(\App\Modules\Project\Models\Project::class);
    }

    public function assignedTo()
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class, 'assigned_to');
    }
}
