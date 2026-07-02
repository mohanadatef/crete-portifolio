<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;

class DynamicSettingCast implements CastsAttributes
{
    /**
     * Cast the given value.
     */
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        $booleanKeys = ['recaptcha_enabled', 'mail_client_enabled', 'mail_agent_enabled'];
        $jsonKeys = ['social_links', 'company_branches', 'company_stats', 'home_partners', 'home_construction_updates'];

        $settingKey = $attributes['key'] ?? '';

        if (in_array($settingKey, $booleanKeys)) {
            return (bool)$value;
        }

        if (in_array($settingKey, $jsonKeys)) {
            if (is_array($value)) {
                return $value;
            }
            return json_decode($value, true) ?: [];
        }

        return $value;
    }

    /**
     * Prepare the given value for storage.
     */
    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_UNICODE);
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        return $value;
    }
}
