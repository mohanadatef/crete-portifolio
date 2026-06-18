<?php

namespace App\Modules\ProjectType\Services;

use App\Modules\ProjectType\Models\ProjectType;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectTypeService
{
    public function getProjectTypes(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $query = ProjectType::query();

        if ($search) {
            $query->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%");
        }

        return $query->latest()->paginate($perPage);
    }

    public function getActiveProjectTypes()
    {
        return ProjectType::where('is_active', true)->get();
    }

    public function createProjectType(array $data): ProjectType
    {
        return ProjectType::create(array_filter($data, fn($value) => !is_null($value)));
    }

    public function updateProjectType(ProjectType $projectType, array $data): ProjectType
    {
        $projectType->update(array_filter($data, fn($value) => !is_null($value)));
        return $projectType;
    }

    public function deleteProjectType(ProjectType $projectType): void
    {
        $projectType->delete();
    }
}
