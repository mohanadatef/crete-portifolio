<?php

namespace App\Modules\Feature\Services;

use App\Modules\Feature\Models\Feature;
use Illuminate\Pagination\LengthAwarePaginator;

class FeatureService
{
    public function getFeatures(int $perPage = 10, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        $query = Feature::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('is_active', filter_var($status, FILTER_VALIDATE_BOOLEAN));
        }

        return $query->latest()->paginate($perPage);
    }

    public function getActiveFeatures()
    {
        return Feature::where('is_active', true)->get();
    }

    public function createFeature(array $data): Feature
    {
        if (empty($data['slug']) && !empty($data['name_en'])) {
            $data['slug'] = $this->generateUniqueSlug($data['name_en']);
        }
        return Feature::create(array_filter($data, fn($value) => !is_null($value)));
    }

    public function updateFeature(Feature $feature, array $data): Feature
    {
        if (empty($data['slug']) && !empty($data['name_en']) && $data['name_en'] !== $feature->name_en) {
            $data['slug'] = $this->generateUniqueSlug($data['name_en'], $feature->id);
        }
        $feature->update(array_filter($data, fn($value) => !is_null($value)));
        return $feature;
    }

    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (true) {
            $query = Feature::where('slug', $slug);
            if ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            }
            if (!$query->exists()) {
                break;
            }
            $slug = $originalSlug . '-' . $count;
            $count++;
        }

        return $slug;
    }

    public function deleteFeature(Feature $feature): void
    {
        if ($feature->projects()->count() > 0) {
            throw new \Exception('Cannot delete a feature that is associated with projects.');
        }
        $feature->delete();
    }
}
