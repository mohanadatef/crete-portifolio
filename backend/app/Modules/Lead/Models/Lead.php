<?php

namespace App\Modules\Lead\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;
use App\Modules\Page\Models\LandingPage;

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
}
