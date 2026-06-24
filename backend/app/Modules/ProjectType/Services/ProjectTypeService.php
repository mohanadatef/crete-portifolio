<?php

namespace App\Modules\ProjectType\Services;

use App\Modules\ProjectType\Models\ProjectType;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectTypeService
{
    public function getProjectTypes(int $perPage = 10, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        $query = ProjectType::query();

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

    public function getActiveProjectTypes()
    {
        return ProjectType::where('is_active', true)->get();
    }

    public function createProjectType(array $data): ProjectType
    {
        if (empty($data['slug']) && !empty($data['name_en'])) {
            $data['slug'] = $this->generateUniqueSlug($data['name_en']);
        }
        return ProjectType::create(array_filter($data, fn($value) => !is_null($value)));
    }

    public function updateProjectType(ProjectType $projectType, array $data): ProjectType
    {
        if (empty($data['slug']) && !empty($data['name_en']) && $data['name_en'] !== $projectType->name_en) {
            $data['slug'] = $this->generateUniqueSlug($data['name_en'], $projectType->id);
        }
        $projectType->update(array_filter($data, fn($value) => !is_null($value)));
        return $projectType;
    }

    private function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (true) {
            $query = ProjectType::where('slug', $slug);
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

    public function deleteProjectType(ProjectType $projectType): void
    {
        if ($projectType->projects()->count() > 0) {
            throw new \Exception('Cannot delete a project type that has projects associated with it.');
        }
        $projectType->delete();
    }
}
