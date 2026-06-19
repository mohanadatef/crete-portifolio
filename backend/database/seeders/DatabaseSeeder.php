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
                'password' => bcrypt('password'),
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
    }
}
