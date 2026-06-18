<?php

namespace App\Modules\Setting\Services;

use App\Modules\Setting\Models\Setting;
use Illuminate\Database\Eloquent\Collection;

class SettingService
{
    public function getAllSettings(): Collection
    {
        return Setting::all();
    }

    public function getSettingsMap(): \Illuminate\Support\Collection
    {
        return Setting::all()->pluck('value', 'key');
    }

    public function getSettingById(int $id): Setting
    {
        return Setting::findOrFail($id);
    }

    public function createSetting(array $data): Setting
    {
        return Setting::create($data);
    }

    public function updateSetting(int $id, array $data): Setting
    {
        $setting = $this->getSettingById($id);
        $setting->update($data);
        return $setting;
    }

    public function updateBulkSettings(array $settings): void
    {
        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }

    public function deleteSetting(int $id): bool
    {
        return Setting::destroy($id) > 0;
    }
}
