<?php

namespace App\Modules\Page\Services;

use App\Modules\Page\Models\Page;
use App\Modules\Page\Models\LandingPage;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PageService
{
    // --- Standard Pages ---

    public function getAllPages(): Collection
    {
        return Page::latest()->get();
    }

    public function getPageBySlug(string $slug): Page
    {
        return Page::where('slug', $slug)->where('status', 1)->firstOrFail();
    }

    public function getPageById(int $id): Page
    {
        return Page::findOrFail($id);
    }

    public function createPage(array $data): Page
    {
        return Page::create($data);
    }

    public function updatePage(int $id, array $data): Page
    {
        $page = $this->getPageById($id);
        $page->update($data);
        return $page;
    }

    public function deletePage(int $id): bool
    {
        return Page::destroy($id) > 0;
    }

    // --- Landing Pages ---

    public function getLandingPagesPaginator(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = LandingPage::query()->with('project');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('title_en', 'like', "%{$search}%")
                  ->orWhere('title_ar', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', filter_var($filters['status'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['project_id'])) {
            $query->where('project_id', $filters['project_id']);
        }

        return $query->latest()->paginate($perPage);
    }

    public function getLandingPageBySlug(string $slug): LandingPage
    {
        return LandingPage::with('project')->where('slug', $slug)->where('status', 1)->firstOrFail();
    }

    public function getLandingPageById(int $id): LandingPage
    {
        return LandingPage::with('project')->findOrFail($id);
    }

    public function createLandingPage(array $data): LandingPage
    {
        return LandingPage::create($data);
    }

    public function updateLandingPage(int $id, array $data): LandingPage
    {
        $page = $this->getLandingPageById($id);

        if (isset($data['form_schema']) && $page->leads()->count() > 0) {
            $oldSchema = $page->form_schema ?? [];
            $newSchema = $data['form_schema'] ?? [];

            $oldFields = [];
            foreach ($oldSchema as $field) {
                if (isset($field['name'])) {
                    $oldFields[$field['name']] = $field;
                }
            }

            $newFields = [];
            foreach ($newSchema as $field) {
                if (isset($field['name'])) {
                    $newFields[$field['name']] = $field;
                }
            }

            foreach ($oldFields as $name => $oldField) {
                if (!isset($newFields[$name])) {
                    throw new \Exception("Cannot delete field '{$oldField['label_en']}' because this landing page already has leads.");
                }
                if ($newFields[$name]['type'] !== $oldField['type']) {
                    throw new \Exception("Cannot change type of field '{$oldField['label_en']}' because this landing page already has leads.");
                }
            }
        }

        $page->update($data);
        return $page;
    }

    public function deleteLandingPage(int $id): bool
    {
        $page = $this->getLandingPageById($id);
        
        if ($page->leads()->count() > 0) {
            throw new \Exception('Cannot delete a landing page that has leads.');
        }

        return $page->delete();
    }
}
