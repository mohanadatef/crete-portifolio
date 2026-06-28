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
            'blog-categories', 'blog-posts', 'features'
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
        $permissions[] = 'export-leads';

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
            'view-features', 'create-features', 'edit-features', 'delete-features',
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

        // Home Page — content matches the premium template design sections
        \App\Modules\Page\Models\Page::firstOrCreate(
            ['slug' => 'home'],
            [
                'title_en' => 'Home',
                'title_ar' => 'الرئيسية',
                'content_en' => '<h2>Discover Luxury Living</h2><p>Experience the finest in premium real estate. We bring you handpicked properties that redefine elegance and comfort.</p><hr><h3>Our Achievements</h3><ul><li><strong>500+</strong> Units Delivered</li><li><strong>15+</strong> Elite Projects</li><li><strong>10+</strong> Years of Excellence</li><li><strong>100%</strong> Client Satisfaction</li></ul><hr><h3>Why Choose Us</h3><p><strong>Trusted &amp; Secure</strong> — Every transaction is backed by full legal compliance, transparent contracts, and uncompromising integrity.</p><p><strong>Unrivalled Excellence</strong> — From architectural design to interior finishes, every detail is crafted to the highest standard.</p><p><strong>Award-Winning</strong> — Recognised internationally for innovation, quality, and design.</p>',
                'content_ar' => '<h2>اكتشف الحياة الفاخرة</h2><p>اختبر الأفضل في العقارات الفاخرة. نقدم لك عقارات مختارة بعناية تعيد تعريف الأناقة والراحة.</p><hr><h3>إنجازاتنا</h3><ul><li><strong>500+</strong> وحدة تم تسليمها</li><li><strong>15+</strong> مشروع متميز</li><li><strong>10+</strong> سنوات من التميز</li><li><strong>100%</strong> رضا العملاء</li></ul><hr><h3>لماذا تختارنا</h3><p><strong>موثوق وآمن</strong> — كل معاملة مدعومة بالامتثال القانوني الكامل والعقود الشفافة والنزاهة.</p><p><strong>تميز لا مثيل له</strong> — من التصميم المعماري إلى التشطيبات الداخلية، يتم صياغة كل تفصيلة وفقاً لأعلى المعايير.</p><p><strong>حائز على جوائز</strong> — معترف به دولياً للابتكار والجودة والتصميم.</p>',
                'status' => 1,
                'is_system' => 1
            ]
        );

        // Rename any old 'about' page to 'about-us' to preserve it
        \App\Modules\Page\Models\Page::where('slug', 'about')->update(['slug' => 'about-us']);

        \App\Modules\Page\Models\Page::firstOrCreate(
            ['slug' => 'about-us'],
            [
                'title_en' => 'About Us',
                'title_ar' => 'من نحن',
                'content_en' => '<h1>About Us</h1><p>We are a premium real estate developer committed to luxury and trust.</p>',
                'content_ar' => '<h1>من نحن</h1><p>نحن شركة تطوير عقاري رائدة ملتزمة بالفخامة والثقة.</p>',
                'status' => 1
            ]
        );

        \App\Modules\Page\Models\Page::firstOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title_en' => 'Privacy Policy',
                'title_ar' => 'سياسة الخصوصية',
                'content_en' => '<h1>Privacy Policy</h1><p>Your privacy is important to us...</p>',
                'content_ar' => '<h1>سياسة الخصوصية</h1><p>خصوصيتك تهمنا...</p>',
                'status' => 1
            ]
        );

        \App\Modules\Page\Models\Page::firstOrCreate(
            ['slug' => 'contact-us'],
            [
                'title_en' => 'Contact Us',
                'title_ar' => 'اتصل بنا',
                'content_en' => '',
                'content_ar' => '',
                'status' => 1,
                'is_system' => 1,
                'meta_fields' => [
                    'layout' => 'default',
                    'show_title' => false,
                    'padding' => 'medium',
                    'bg_color' => '#ffffff',
                    'show_in_navbar' => true,
                    'show_in_footer' => true,
                    'editor_mode' => 'builder',
                    'blocks' => [
                        [
                            'type' => 'contact',
                            'title_en' => 'Contact Us',
                            'title_ar' => 'اتصل بنا',
                            'desc_en' => 'We combine decades of expertise with an unwavering commitment to luxury, trust, and client success.',
                            'desc_ar' => 'نحن نجمع بين عقود من الخبرة والتزام راسخ بالفخامة والثقة ونجاح عملائنا.',
                            'show_form' => true,
                            'show_details' => true,
                            'fields' => [
                                ['name' => 'name', 'type' => 'text', 'label_en' => 'Full Name', 'label_ar' => 'الاسم الكامل', 'required' => true],
                                ['name' => 'phone', 'type' => 'tel', 'label_en' => 'Phone Number', 'label_ar' => 'رقم الهاتف', 'required' => true],
                                ['name' => 'email', 'type' => 'email', 'label_en' => 'Email Address', 'label_ar' => 'البريد الإلكتروني', 'required' => false],
                                ['name' => 'message', 'type' => 'textarea', 'label_en' => 'Message', 'label_ar' => 'الرسالة', 'required' => false]
                            ]
                        ]
                    ]
                ]
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

        // Seed Features
        $features = [
            ['name_en' => 'Swimming Pool', 'name_ar' => 'حمّام سباحة', 'slug' => 'swimming-pool'],
            ['name_en' => 'Gym', 'name_ar' => 'صالة ألعاب رياضية', 'slug' => 'gym'],
            ['name_en' => 'Parking', 'name_ar' => 'موقف سيارات', 'slug' => 'parking'],
            ['name_en' => '24/7 Security', 'name_ar' => 'أمن 24/7', 'slug' => 'security'],
            ['name_en' => 'Green Areas', 'name_ar' => 'مساحات خضراء', 'slug' => 'green-areas']
        ];
        foreach ($features as $feat) {
            \App\Modules\Feature\Models\Feature::firstOrCreate(
                ['slug' => $feat['slug']],
                ['name_en' => $feat['name_en'], 'name_ar' => $feat['name_ar'], 'is_active' => true]
            );
        }

        // Associate features with Skyline Heights
        if ($project1) {
            $featureIds = \App\Modules\Feature\Models\Feature::whereIn('slug', ['swimming-pool', 'gym', 'parking'])->pluck('id')->toArray();
            $project1->features()->sync($featureIds);
        }

        // Seed Contact Settings
        $branches = [
            [
                'name_en' => 'Main Office (Dubai)',
                'name_ar' => 'المكتب الرئيسي (دبي)',
                'phones' => ['+971 50 123 4567', '+971 4 123 4567'],
                'emails' => ['info@crete.com', 'sales@crete.com'],
                'address_en' => 'Marina Heights, Dubai, UAE',
                'address_ar' => 'أبراج المارينا، دبي، الإمارات العربية المتحدة',
            ],
            [
                'name_en' => 'Cairo Branch',
                'name_ar' => 'فرع القاهرة',
                'phones' => ['+20 2 1234 5678'],
                'emails' => ['cairo@crete.com'],
                'address_en' => 'New Cairo, Egypt',
                'address_ar' => 'القاهرة الجديدة، مصر',
            ]
        ];
        
        \App\Modules\Setting\Models\Setting::updateOrCreate(
            ['key' => 'company_branches'],
            ['value' => json_encode($branches)]
        );
    }
}
