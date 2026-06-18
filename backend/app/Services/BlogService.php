<?php

namespace App\Services;

use App\Modules\Blog\Models\BlogCategory;
use App\Modules\Blog\Models\BlogPost;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class BlogService
{
    // --- Categories ---

    public function getCategoriesPaginator(int $perPage = 15): LengthAwarePaginator
    {
        return BlogCategory::latest()->paginate($perPage);
    }

    public function getAllCategories(): Collection
    {
        return BlogCategory::latest()->get();
    }

    public function getCategoryById(int $id): BlogCategory
    {
        return BlogCategory::findOrFail($id);
    }

    public function createCategory(array $data): BlogCategory
    {
        return BlogCategory::create($data);
    }

    public function updateCategory(int $id, array $data): BlogCategory
    {
        $category = $this->getCategoryById($id);
        $category->update($data);
        return $category;
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
