<?php

namespace App\Modules\Project\Services;

use App\Modules\Project\Models\Project;
use App\Modules\Project\DTOs\ProjectFilterDTO;
use Illuminate\Pagination\LengthAwarePaginator;

class ProjectService
{
    public function getProjects(ProjectFilterDTO $filter, int $perPage = 15, bool $onlyPublished = false): LengthAwarePaginator
    {
        $query = Project::with(['projectImages', 'projectType']);

        if ($onlyPublished) {
            $query->where('status', 1);
        } elseif ($filter->status !== null) {
            $query->where('status', $filter->status);
        }

        if ($filter->project_type_id) {
            $query->where('project_type_id', $filter->project_type_id);
        }

        if ($filter->location) {
            $query->where('location', 'like', '%' . $filter->location . '%');
        }

        if ($filter->search) {
            $query->where(function ($q) use ($filter) {
                $q->where('title_en', 'like', '%' . $filter->search . '%')
                  ->orWhere('title_ar', 'like', '%' . $filter->search . '%');
            });
        }

        if ($filter->minPrice !== null) {
            $query->where('price', '>=', $filter->minPrice);
        }

        if ($filter->maxPrice !== null) {
            $query->where('price', '<=', $filter->maxPrice);
        }

        if ($filter->bedrooms !== null) {
            $query->where('bedrooms', $filter->bedrooms);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getProjectBySlug(string $slug): Project
    {
        return Project::with(['projectImages', 'projectType'])->where('slug', $slug)->where('status', 1)->firstOrFail();
    }

    public function getProjectById(int $id): Project
    {
        return Project::with(['projectImages', 'projectType'])->findOrFail($id);
    }

    public function createProject(array $data): Project
    {
        return Project::create($data);
    }

    public function updateProject(Project $project, array $data): bool
    {
        return $project->update($data);
    }

    public function deleteProject(int $id): bool
    {
        return Project::destroy($id) > 0;
    }
}
