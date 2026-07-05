<?php

namespace App\Modules\Lead\Models;

use Illuminate\Database\Eloquent\Model;

class CustomReport extends Model
{
    protected $table = 'custom_reports';

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'entity_type',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(\App\Modules\User\Models\User::class);
    }
}
