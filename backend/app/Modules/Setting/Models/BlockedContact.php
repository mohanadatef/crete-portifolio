<?php

namespace App\Modules\Setting\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BlockedContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'value',
        'type',
        'reason',
    ];
}
