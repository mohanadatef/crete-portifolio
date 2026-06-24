<?php

namespace App\Services;

use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BlogService
{
    // --- Categories ---

    public function getCategoriesPaginator(int $perPage = 10, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        $query = BlogCategory::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', filter_var($status, FILTER_VALIDATE_BOOLEAN));
        }

        return $query->latest()->paginate($perPage);
    }

    public function getAllCategories(): Collection
    {
        return BlogCategory::latest()->get();
    }

    public function getActiveCategories(): Collection
    {
        return BlogCategory::where('status', true)->latest()->get();
    }

    public function getCategoryById(int $id): BlogCategory
    {
        return BlogCategory::findOrFail($id);
    }

    public function createCategory(array $data): BlogCategory
    {
        if (empty($data['slug']) && !empty($data['name_en'])) {
            $data['slug'] = $this->generateUniqueCategorySlug($data['name_en']);
        }
        return BlogCategory::create($data);
    }

    public function updateCategory(int $id, array $data): BlogCategory
    {
        $category = $this->getCategoryById($id);
        if (empty($data['slug']) && !empty($data['name_en']) && $data['name_en'] !== $category->name_en) {
            $data['slug'] = $this->generateUniqueCategorySlug($data['name_en'], $category->id);
        }
        $category->update($data);
        return $category;
    }

    private function generateUniqueCategorySlug(string $name, ?int $ignoreId = null): string
    {
        $slug = \Illuminate\Support\Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (true) {
            $query = BlogCategory::where('slug', $slug);
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

    public function deleteCategory(int $id): bool
    {
        return BlogCategory::destroy($id) > 0;
    }

    // --- Posts ---

    public function getPostsPaginator(int $perPage = 15, bool $onlyPublished = false): LengthAwarePaginator
    {
        $query = BlogPost::with('category')->latest();
        if ($onlyPublished) {
            $query->where('status', 1);
        }
        return $query->paginate($perPage);
    }

    public function getPostBySlug(string $slug): BlogPost
    {
        return BlogPost::where('slug', $slug)->where('status', 1)->firstOrFail();
    }

    public function getPostById(int $id): BlogPost
    {
        return BlogPost::findOrFail($id);
    }

    public function createPost(array $data): BlogPost
    {
        return BlogPost::create($data);
    }

    public function updatePost(int $id, array $data): BlogPost
    {
        $post = $this->getPostById($id);
        $post->update($data);
        return $post;
    }

    public function deletePost(int $id): bool
    {
        return BlogPost::destroy($id) > 0;
    }
}
