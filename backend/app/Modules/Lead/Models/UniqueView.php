<?php

namespace App\Modules\Lead\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UniqueView extends Model
{
    use HasFactory;

    protected $fillable = [
        'ip_address',
        'viewable_type',
        'viewable_id'
    ];

    /**
     * Log a unique view by IP address.
     * Returns true if it was logged as a new unique view, false otherwise.
     */
    public static function logView(string $ipAddress, string $type, ?int $id = null): bool
    {
        // Check if this IP has already viewed this specific target
        $exists = self::where('ip_address', $ipAddress)
            ->where('viewable_type', $type)
            ->where('viewable_id', $id)
            ->exists();

        if (!$exists) {
            self::create([
                'ip_address' => $ipAddress,
                'viewable_type' => $type,
                'viewable_id' => $id
            ]);
            return true;
        }

        return false;
    }
}
