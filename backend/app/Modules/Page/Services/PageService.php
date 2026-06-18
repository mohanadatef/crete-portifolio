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

    public function getLandingPagesPaginator(int $perPage = 15): LengthAwarePaginator
    {
        return LandingPage::latest()->paginate($perPage);
    }

    public function getLandingPageBySlug(string $slug): LandingPage
    {
        return LandingPage::where('slug', $slug)->where('status', 1)->firstOrFail();
    }

    public function getLandingPageById(int $id): LandingPage
    {
        return LandingPage::findOrFail($id);
    }

    public function createLandingPage(array $data): LandingPage
    {
        return LandingPage::create($data);
    }

    public function updateLandingPage(int $id, array $data): LandingPage
    {
        $page = $this->getLandingPageById($id);
        $page->update($data);
        return $page;
    }

    public function deleteLandingPage(int $id): bool
    {
        return LandingPage::destroy($id) > 0;
    }
}
