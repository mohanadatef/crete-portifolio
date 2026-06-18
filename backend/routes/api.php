<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Page\Controllers\PageController;
use App\Modules\Project\Controllers\ProjectController;
use App\Modules\Setting\Controllers\SettingController;
use App\Modules\Page\Controllers\LandingPageController;
use App\Modules\Lead\Controllers\LeadController;
use App\Modules\Blog\Controllers\BlogCategoryController;
use App\Modules\Blog\Controllers\BlogPostController;
use App\Modules\User\Controllers\UserController;
use App\Modules\User\Controllers\RoleController;

Route::prefix('v1')->group(function () {
    // Public APIs
    Route::get('/public/pages/{slug}', [PageController::class, 'showPublic']);
    Route::get('/public/settings', [SettingController::class, 'indexPublic']);
    Route::get('/public/projects', [ProjectController::class, 'indexPublic']);
    Route::get('/public/projects/{slug}', [ProjectController::class, 'showPublic']);
    Route::get('/public/project-types', [App\Modules\ProjectType\Controllers\ProjectTypeController::class, 'active']);
    Route::post('/public/leads', [LeadController::class, 'store'])->middleware('throttle:5,1'); // Public form submission

    Route::get('/public/landing-pages/{slug}', [LandingPageController::class, 'showPublic']);

    Route::get('/public/blog/categories', [BlogCategoryController::class, 'indexPublic']);
    Route::get('/public/blog/posts', [BlogPostController::class, 'indexPublic']);
    Route::get('/public/blog/posts/{slug}', [BlogPostController::class, 'showPublic']);

    Route::post('/admin/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/admin/logout', [AuthController::class, 'logout']);
        
        Route::post('/admin/media', [\App\Modules\Media\Controllers\MediaController::class, 'store']);
        Route::get('/admin/dashboard', function () {
            return response()->json([
                'projects_count' => \App\Modules\Project\Models\Project::count(),
                'pages_count' => \App\Modules\Page\Models\Page::count(),
                'landing_pages_count' => \App\Modules\Page\Models\LandingPage::count(),
                'blog_posts_count' => \App\Modules\Blog\Models\BlogPost::count(),
                'leads_count' => \App\Modules\Lead\Models\Lead::count(),
            ]);
        });

        Route::apiResource('/admin/pages', PageController::class);
        // User Management
        Route::apiResource('/admin/users', UserController::class);
        
        // Role Management
        Route::get('/admin/roles/permissions', [RoleController::class, 'permissions']);
        Route::apiResource('/admin/roles', RoleController::class);

        Route::apiResource('/admin/projects', ProjectController::class);
        
        // Project Types Management
        Route::get('/admin/project-types/active', [App\Modules\ProjectType\Controllers\ProjectTypeController::class, 'active']);
        Route::apiResource('/admin/project-types', App\Modules\ProjectType\Controllers\ProjectTypeController::class);

        Route::post('/admin/settings/bulk', [SettingController::class, 'updateBulk']);
        Route::apiResource('/admin/settings', SettingController::class);
        
        // Phase 3 & 4
        Route::apiResource('/admin/landing-pages', LandingPageController::class);
        Route::apiResource('/admin/leads', LeadController::class)->except(['store', 'update']); // Admin only views and deletes
        Route::apiResource('/admin/blog-categories', BlogCategoryController::class);
        Route::apiResource('/admin/blog-posts', BlogPostController::class);
    });
});
