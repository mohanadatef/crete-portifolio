<?php

namespace App\Modules\Setting\Services;

use App\Modules\Setting\Models\Setting;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SettingService
{
    private const CACHE_KEY = 'settings_map';

    public function getAllSettings(): Collection
    {
        return Setting::all();
    }

    public function getSettingsMap(): \Illuminate\Support\Collection
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            return Setting::all()->pluck('value', 'key');
        });
    }

    public function getSettingById(int $id): Setting
    {
        return Setting::findOrFail($id);
    }

    public function createSetting(array $data): Setting
    {
        return DB::transaction(function () use ($data) {
            $setting = Setting::create($data);
            Cache::forget(self::CACHE_KEY);
            return $setting;
        });
    }

    public function updateSetting(int $id, array $data): Setting
    {
        return DB::transaction(function () use ($id, $data) {
            $setting = $this->getSettingById($id);
            $setting->update($data);
            Cache::forget(self::CACHE_KEY);
            return $setting;
        });
    }

    public function updateBulkSettings(array $settings): void
    {
        DB::transaction(function () use ($settings) {
            foreach ($settings as $key => $value) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => $value]
                );
            }
            Cache::forget(self::CACHE_KEY);
        });
    }

    public function deleteSetting(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $deleted = Setting::destroy($id) > 0;
            if ($deleted) {
                Cache::forget(self::CACHE_KEY);
            }
            return $deleted;
        });
    }
}
