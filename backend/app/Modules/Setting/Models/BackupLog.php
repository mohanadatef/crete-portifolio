<?php

namespace App\Modules\Setting\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\User\Models\User;

class BackupLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'filename',
        'status',
    ];

    /**
     * Get the user who triggered the backup.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
