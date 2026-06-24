<?php

namespace Database\Seeders;

use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Detailed Permissions array
        $modules = [
            'users', 'roles', 'projects', 'project-types', 
            'pages', 'landing-pages', 'leads', 
            'blog-categories', 'blog-posts'
        ];

        $actions = ['view', 'create', 'edit', 'delete'];
        $permissions = [];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                // E.g., view-users, create-users, etc.
                $permissions[] = "{$action}-{$module}";
            }
        }
        // Settings only need view and edit
        $permissions[] = 'view-settings';
        $permissions[] = 'edit-settings';
        
        // Leads detailed access permissions
        $permissions[] = 'view-all-leads';
        $permissions[] = 'view-unassigned-leads';

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // 2. Roles
        $superAdmin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        // Assign all to super admin
        $superAdmin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        $contentEditor = Role::firstOrCreate(['name' => 'Content Editor', 'guard_name' => 'sanctum']);
        // Content Editor specific permissions
        $editorPerms = [
            'view-projects', 'create-projects', 'edit-projects', 'delete-projects',
            'view-pages', 'create-pages', 'edit-pages', 'delete-pages',
            'view-blog-categories', 'create-blog-categories', 'edit-blog-categories', 'delete-blog-categories',
            'view-blog-posts', 'create-blog-posts', 'edit-blog-posts', 'delete-blog-posts',
            'view-landing-pages', 'create-landing-pages', 'edit-landing-pages', 'delete-landing-pages',
        ];
        $contentEditor->syncPermissions($editorPerms);

        // 3. User
        $user = User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'is_active' => 1
            ]
        );

        if (!$user->hasRole('admin', 'sanctum')) {
            $user->assignRole($superAdmin);
        }

        // 4. Sample Data
        $this->seedSampleData();
    }

    private function seedSampleData(): void
    {
        // Blog Categories
        $newsCat = \App\Modules\Blog\Models\BlogCategory::firstOrCreate(
            ['slug' => 'news'],
            ['name_en' => 'Company News', 'name_ar' => 'أخبار الشركة']
        );
        $tipsCat = \App\Modules\Blog\Models\BlogCategory::firstOrCreate(
            ['slug' => 'tips'],
            ['name_en' => 'Real Estate Tips', 'name_ar' => 'نصائح عقارية']
        );

        // Blog Posts
        \App\Modules\Blog\Models\BlogPost::firstOrCreate(
            ['slug' => 'new-project-launch'],
            [
                'blog_category_id' => $newsCat->id,
                'title_en' => 'Launch of our New Commercial Project',
                'title_ar' => 'إطلاق مشروعنا التجاري الجديد',
                'content_en' => 'We are excited to announce our brand new state-of-the-art commercial building.',
                'content_ar' => 'نحن متحمسون للإعلان عن مبنانا التجاري الجديد والمجهز بأحدث التقنيات.',
                'status' => 1
            ]
        );
        \App\Modules\Blog\Models\BlogPost::firstOrCreate(
            ['slug' => 'how-to-buy-first-home'],
            [
                'blog_category_id' => $tipsCat->id,
                'title_en' => 'How to Buy Your First Home',
                'title_ar' => 'كيف تشتري منزلك الأول',
                'content_en' => 'Buying a house can be intimidating. Follow these 5 steps...',
                'content_ar' => 'شراء منزل قد يكون مقلقاً. اتبع هذه الـ 5 خطوات...',
                'status' => 1
            ]
        );

        // Landing Pages
        \App\Modules\Page\Models\LandingPage::firstOrCreate(
            ['slug' => 'summer-campaign'],
            [
                'title_en' => 'Summer Real Estate Campaign',
                'title_ar' => 'حملة الصيف العقارية',
                'content_en' => '<div class="text-center"><h2>Special Summer Offers</h2><p>Get up to 10% discount on select properties.</p></div>',
                'content_ar' => '<div class="text-center"><h2>عروض الصيف الخاصة</h2><p>احصل على خصم يصل إلى 10٪ على عقارات مختارة.</p></div>',
                'status' => 1
            ]
        );

        // Leads
        \App\Modules\Lead\Models\Lead::firstOrCreate(
            ['email' => 'testlead1@example.com'],
            [
                'name' => 'John Doe',
                'phone' => '+1234567890',
                'message' => 'I am interested in the Summer Campaign properties.',
                'source' => 'summer-campaign'
            ]
        );
        \App\Modules\Lead\Models\Lead::firstOrCreate(
            ['email' => 'testlead2@example.com'],
            [
                'name' => 'Ahmed Ali',
                'phone' => '+0987654321',
                'message' => 'تفاصيل عن المشروع التجاري الجديد من فضلكم.',
                'source' => 'new-project-launch'
            ]
        );

        // Seed Project Types
        $activeType = \App\Modules\ProjectType\Models\ProjectType::updateOrCreate(
            ['slug' => 'residential'],
            ['name_en' => 'Residential', 'name_ar' => 'سكني', 'is_active' => true]
        );

        $inactiveType = \App\Modules\ProjectType\Models\ProjectType::updateOrCreate(
            ['slug' => 'commercial-inactive'],
            ['name_en' => 'Commercial (Inactive)', 'name_ar' => 'تجاري غير نشط', 'is_active' => false]
        );

        // Seed Projects
        $project1 = \App\Modules\Project\Models\Project::updateOrCreate(
            ['slug' => 'skyline-heights'],
            [
                'title_en' => 'Skyline Heights',
                'title_ar' => 'سكاي لاين هايتس',
                'description_en' => '<p>Modern residential complex in New Cairo.</p>',
                'description_ar' => '<p>مجمع سكني حديد في القاهرة الجديدة.</p>',
                'location' => 'New Cairo, Egypt',
                'status' => true,
                'featured' => true,
                'price' => 5000000.00,
                'area' => 250.00,
                'bedrooms' => 3,
                'developer' => 'Emaar',
                'project_type_id' => $activeType->id,
                'views_count' => 124
            ]
        );

        $project2 = \App\Modules\Project\Models\Project::updateOrCreate(
            ['slug' => 'grand-mall'],
            [
                'title_en' => 'Grand Mall',
                'title_ar' => 'جراند مول',
                'description_en' => '<p>Premier commercial spaces.</p>',
                'description_ar' => '<p>مساحات تجارية ممتازة.</p>',
                'location' => 'Sheikh Zayed, Egypt',
                'status' => true,
                'featured' => false,
                'price' => 8000000.00,
                'area' => 450.00,
                'bedrooms' => null,
                'developer' => 'Sodic',
                'project_type_id' => $activeType->id,
                'views_count' => 45
            ]
        );

        // Seed Project Images
        \App\Modules\Project\Models\ProjectImage::updateOrCreate(
            ['project_id' => $project1->id, 'image_path' => '/storage/projects/skyline_1.jpg'],
            ['is_primary' => true]
        );

        \App\Modules\Project\Models\ProjectImage::updateOrCreate(
            ['project_id' => $project1->id, 'image_path' => '/storage/projects/skyline_2.jpg'],
            ['is_primary' => false]
        );

        \App\Modules\Project\Models\ProjectImage::updateOrCreate(
            ['project_id' => $project2->id, 'image_path' => '/storage/projects/mall_1.jpg'],
            ['is_primary' => true]
        );

        // Seed Project Units
        \App\Modules\Project\Models\ProjectUnit::updateOrCreate(
            ['project_id' => $project1->id, 'title_en' => 'Penthouse A'],
            [
                'title_ar' => 'بنتهاوس أ',
                'area' => 180.00,
                'price' => 3500000.00,
                'bedrooms' => 3,
                'bathrooms' => 2,
                'description_en' => '<p>Spacious penthouse with terrace.</p>',
                'description_ar' => '<p>بنتهاوس واسع مع تراس.</p>',
                'image_paths' => ['/storage/projects/units/unit1_1.jpg'],
                'sort_order' => 0
            ]
        );

        \App\Modules\Project\Models\ProjectUnit::updateOrCreate(
            ['project_id' => $project1->id, 'title_en' => 'Apartment B'],
            [
                'title_ar' => 'شقة ب',
                'area' => 120.00,
                'price' => 2200000.00,
                'bedrooms' => 2,
                'bathrooms' => 1,
                'description_en' => '<p>Cozy two-bedroom apartment.</p>',
                'description_ar' => '<p>شقة مريحة بغرفتي نوم.</p>',
                'image_paths' => [],
                'sort_order' => 1
            ]
        );
    }
}
