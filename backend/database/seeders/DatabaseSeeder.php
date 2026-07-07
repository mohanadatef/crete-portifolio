<?php

namespace Database\Seeders;

use App\Modules\User\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Modules\Project\Models\Project;
use App\Modules\Project\Models\ProjectImage;
use App\Modules\ProjectType\Models\ProjectType;
use App\Modules\Feature\Models\Feature;
use App\Modules\Setting\Models\Setting;
use App\Modules\Page\Models\Page;
use App\Modules\Blog\Models\BlogPost;
use App\Modules\Blog\Models\BlogCategory;

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
                $permissions[] = "{$action}-{$module}";
            }
        }
        $permissions[] = 'view-settings';
        $permissions[] = 'edit-settings';
        $permissions[] = 'download-backups';
        $permissions[] = 'manage-blocklist';
        
        $permissions[] = 'view-all-leads';
        $permissions[] = 'view-unassigned-leads';
        $permissions[] = 'export-leads';

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // 2. Roles
        $superAdmin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $superAdmin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        $contentEditor = Role::firstOrCreate(['name' => 'Content Editor', 'guard_name' => 'sanctum']);
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
            ['email' => 'cretedevelopments761@gmail.com'],
            [
                'name' => 'Crete Developments',
                'password' => 'cretedevelopments1122!!',
                'is_active' => 1
            ]
        );

        if (!$user->hasRole('admin', 'sanctum')) {
            $user->assignRole($superAdmin);
        }

        // 4. Seed Real Content & Clear Dummy Data
        $this->seedRealContent();
    }

    private function seedRealContent(): void
    {
        // Clear all dummy records
        BlogPost::query()->delete();
        BlogCategory::query()->delete();
        ProjectImage::query()->delete();
        Project::query()->delete();
        ProjectType::query()->delete();
        Feature::query()->delete();

        // 1. Pages
        Page::updateOrCreate(
            ['slug' => 'home'],
            [
                'title_en' => 'Home',
                'title_ar' => 'الرئيسية',
                'content_en' => '<h2>Discover Luxury Living</h2><p>Experience the finest in premium real estate. We bring you handpicked properties that redefine elegance and comfort.</p><hr><h3>Our Achievements</h3><ul><li><strong>75+</strong> Residential Buildings</li><li><strong>3</strong> Commercial Malls</li><li><strong>1997</strong> Established Year</li><li><strong>100%</strong> Trust &amp; Quality</li></ul><hr><h3>Why Choose Us</h3><p><strong>Trusted &amp; Secure</strong> — Every transaction is backed by full legal compliance, transparent contracts, and uncompromising integrity.</p><p><strong>Unrivalled Excellence</strong> — From architectural design to interior finishes, every detail is crafted to the highest standard.</p><p><strong>Award-Winning</strong> — Recognised internationally for innovation, quality, and design.</p>',
                'content_ar' => '<h2>اكتشف الحياة الفاخرة</h2><p>اختبر الأفضل in العقارات الفاخرة. نقدم لك عقارات مختارة بعناية تعيد تعريف الأناقة والراحة.</p><hr><h3>إنجازاتنا</h3><ul><li><strong>75+</strong> عمارة سكنية</li><li><strong>3</strong> مولات تجارية</li><li><strong>1997</strong> سنة التأسيس</li><li><strong>100%</strong> ثقة وجودة</li></ul><hr><h3>لماذا تختارنا</h3><p><strong>موثوق وآمن</strong> — كل معاملة مدعومة بالامتثال القانوني الكامل والعقود الشفافة والنزاهة.</p><p><strong>تميز لا مثيل له</strong> — من التصميم المعماري إلى التشطيبات الداخلية، يتم صياغة كل تفصيلة وفقاً لأعلى المعايير.</p><p><strong>حائز على جوائز</strong> — معترف به دولياً للابتكار والجودة والتصميم.</p>',
                'status' => 1
            ]
        );

        // About Us Page (Premium Builder Layout)
        Page::updateOrCreate(
            ['slug' => 'about-us'],
            [
                'title_en' => 'About Us',
                'title_ar' => 'من نحن',
                'content_en' => '',
                'content_ar' => '',
                'status' => 1,
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
                            'type' => 'hero',
                            'title_en' => 'About Crete Developments',
                            'title_ar' => 'عن كريت للتطوير العقاري',
                            'subtitle_en' => 'Building Trust, Value, and Innovation Since 1997',
                            'subtitle_ar' => 'نبني الثقة، القيمة، والابتكار منذ عام 1997',
                            'bg_image' => 'projects/nine_mall_1.jpg',
                            'overlay_opacity' => 0.55
                        ],
                        [
                            'type' => 'split',
                            'layout' => 'left',
                            'title_en' => 'Our Legacy & Expansion',
                            'title_ar' => 'مسيرة حافلة بالإنجازات',
                            'text_en' => "Since 1997, Crete Developments has delivered over 75 premium residential buildings across East and West Cairo, building a reputation for absolute commitment to quality and client trust.\n\nIn 2025, after an in-depth market research, we expanded into commercial developments starting with Nine Mall, Traffic Mall, and Arena Mall, delivering strategic investments in high-density growth zones.",
                            'text_ar' => "منذ عام 1997، بدأت رحلتها في مجال التطوير العقاري، ونجحوا خلال هذه السنوات في تسليم أكثر من 75 عمارة سكنية في شرق وغرب القاهرة. وبنينا سمعة راسخة تقوم على الالتزام الكامل بالجودة وثقة عملائنا.\n\nوبعد دراسة متعمقة للسوق العقاري، قرروا في عام 2025 التوسع بمحفظة أراضٍ تجارية، لتكون بداية انطلاقتهم في القطاع التجاري من خلال Nine Mall، يليه Traffic Mall، ثم Arena Mall، لتقديم فرص استثمارية فريدة وقوية.",
                            'media_type' => 'image',
                            'media_url' => 'projects/traffic_mall_1.jpg'
                        ],
                        [
                            'type' => 'features',
                            'title_en' => 'Our Vision & Mission',
                            'title_ar' => 'رؤيتنا ورسالتنا',
                            'subtitle_en' => 'The guiding principles behind our landmarks',
                            'subtitle_ar' => 'المبادئ التوجيهية وراء بناء مشاريعنا المتميزة',
                            'items' => [
                                [
                                    'icon' => 'star',
                                    'title_en' => 'Our Vision',
                                    'title_ar' => 'رؤيتنا',
                                    'desc_en' => 'To become one of the leading real estate developers in Egypt by delivering distinguished residential and commercial projects in strategic locations that create real investment value and contribute to the development of thriving communities.',
                                    'desc_ar' => 'أن تصبح كريت للتطوير العقاري واحدة من الشركات الرائدة في تطوير المشروعات التجارية والسكنية في مصر، من خلال تقديم مشروعات متميزة في مواقع استراتيجية تحقق قيمة استثمارية حقيقية وتساهم في تطوير المجتمعات العمرانية.'
                                ],
                                [
                                    'icon' => 'shield',
                                    'title_en' => 'Our Mission',
                                    'title_ar' => 'رسالتنا',
                                    'desc_en' => 'Crete Developments is committed to delivering high-quality real estate projects through strategic location selection, modern designs, and flexible investment solutions that meet clients’ needs while ensuring sustainable value and maintaining the highest standards of credibility and execution.',
                                    'desc_ar' => 'تلتزم كريت للتطوير العقاري بتطوير مشروعات عالية الجودة تعتمد على اختيار المواقع المميزة والتصميمات العصرية، مع تقديم حلول استثمارية مرنة تلبي احتياجات العملاء وتحقق عائدًا مستدامًا، مع الحفاظ على أعلى معايير المصداقية والتنفيذ.'
                                ]
                            ]
                        ],
                        [
                            'type' => 'features',
                            'title_en' => 'Our Core Values',
                            'title_ar' => 'قيمنا الأساسية',
                            'subtitle_en' => 'The foundation of everything we build',
                            'subtitle_ar' => 'الأساس الذي نبني عليه كل شيء',
                            'items' => [
                                [
                                    'icon' => 'shield',
                                    'title_en' => 'Integrity',
                                    'title_ar' => 'النزاهة والمصداقية',
                                    'desc_en' => 'We maintain absolute transparency, clear contracts, and full legal compliance in every deal.',
                                    'desc_ar' => 'نلتزم بالشفافية الكاملة، والعقود الواضحة، والامتثال القانوني الشامل في كل صفقة.'
                                ],
                                [
                                    'icon' => 'award',
                                    'title_en' => 'Excellence & Quality',
                                    'title_ar' => 'التميز والجودة',
                                    'desc_en' => 'From premium construction materials to professional finishes, quality is our top signature.',
                                    'desc_ar' => 'من مواد البناء الفاخرة إلى التشطيبات الاحترافية، الجودة هي بصمتنا الأساسية.'
                                ],
                                [
                                    'icon' => 'star',
                                    'title_en' => 'Innovation',
                                    'title_ar' => 'الابتكار والتطوير',
                                    'desc_en' => 'Applying smart systems, green technologies, and modern architecture to create unique experiences.',
                                    'desc_ar' => 'تطبيق الأنظمة الذكية، والتقنيات الخضراء، والعمارة الحديثة لتقديم تجارب فريدة.'
                                ],
                                [
                                    'icon' => 'heart',
                                    'title_en' => 'Customer Commitment',
                                    'title_ar' => 'الالتزام تجاه العملاء',
                                    'desc_en' => 'Delivering on time, honoring payment plans, and offering premium property management services.',
                                    'desc_ar' => 'التسليم في المواعيد المحددة، الالتزام بخطط السداد، وتقديم خدمات متميزة لإدارة العقارات.'
                                ]
                            ]
                        ],
                        [
                            'type' => 'features',
                            'title_en' => 'Why Choose Crete Developments',
                            'title_ar' => 'لماذا تختار كريت للتطوير العقاري',
                            'subtitle_en' => 'Strategic features that maximize your investment return',
                            'subtitle_ar' => 'ميزات استراتيجية تزيد من عوائد استثمارك',
                            'items' => [
                                [
                                    'icon' => 'map',
                                    'title_en' => 'Strategic Locations',
                                    'title_ar' => 'مواقع استراتيجية متميزة',
                                    'desc_en' => 'Our projects are situated on main roads and high-density zones in Obour City, guaranteeing excellent traffic.',
                                    'desc_ar' => 'تقع مشاريعنا على شوارع رئيسية ومناطق عالية الكثافة بمدينة العبور، مما يضمن حركة مرور ممتازة.'
                                ],
                                [
                                    'icon' => 'image',
                                    'title_en' => 'Premium & Modern Designs',
                                    'title_ar' => 'تصاميم راقية وعصرية',
                                    'desc_en' => 'We implement international design standards with open panoramic frontages and green plaza areas.',
                                    'desc_ar' => 'نطبق معايير التصميم العالمية مع واجهات بانورامية مفتوحة ومساحات بلازا خضراء.'
                                ],
                                [
                                    'icon' => 'star',
                                    'title_en' => 'Flexible Payment Plans',
                                    'title_ar' => 'خطط سداد مرنة',
                                    'desc_en' => 'We offer tailored investment options and installment structures to suit your financial goals.',
                                    'desc_ar' => 'نقدم خيارات استثمارية مخصصة وهياكل تقسيط تناسب أهدافك المالية.'
                                ]
                            ]
                        ],
                        [
                            'type' => 'content',
                            'content_en' => "<div class='py-12 bg-gray-50/50 rounded-3xl p-8 border border-gray-100/50 max-w-4xl mx-auto'><h3 class='text-2xl font-bold text-center text-[#0d1f4a] mb-8' style=\"font-family: 'Playfair Display', serif;\">Our Founders & Leadership</h3><div class='grid grid-cols-1 md:grid-cols-2 gap-6 text-center'><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>Ashraf Helal Sadek</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>Founder</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>Hany Gamil Honein</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>Founder</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>Yasser Shokry Said</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>Founder</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>Magdy Zakher Shaker Zakhary</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>Founder</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100 md:col-span-2 max-w-md mx-auto w-full'><p class='font-bold text-gray-800 text-base'>Safwat Lotfy Gad Moawad</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>Founder</p></div></div></div>",
                            'content_ar' => "<div class='py-12 bg-gray-50/50 rounded-3xl p-8 border border-gray-100/50 max-w-4xl mx-auto' dir='rtl'><h3 class='text-2xl font-bold text-center text-[#0d1f4a] mb-8' style=\"font-family: 'Playfair Display', serif;\">مؤسسو ومجلس إدارة الشركة</h3><div class='grid grid-cols-1 md:grid-cols-2 gap-6 text-center'><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>أشرف هلال صادق</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>مؤسس</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>هاني جميل حنين</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>مؤسس</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>ياسر شكري سعيد</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>مؤسس</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100'><p class='font-bold text-gray-800 text-base'>مجدي زاخر شاكر زخاري</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>مؤسس</p></div><div class='p-4 bg-white rounded-2xl shadow-sm border border-gray-100 md:col-span-2 max-w-md mx-auto w-full'><p class='font-bold text-gray-800 text-base'>صفوت لطفي جاد معوض</p><p class='text-xs text-crete-gold uppercase tracking-wider font-semibold mt-1'>مؤسس</p></div></div></div>"
                        ]
                    ]
                ]
            ]
        );

        // Privacy Policy Page
        Page::updateOrCreate(
            ['slug' => 'privacy-policy'],
            [
                'title_en' => 'Privacy Policy',
                'title_ar' => 'سياسة الخصوصية',
                'content_en' => '<div class="max-w-4xl mx-auto py-12 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8"><div class="text-center mb-8"><h1 class="text-3xl font-extrabold text-crete-blue" style="font-family: \'Playfair Display\', serif;">Privacy Policy</h1><div class="h-1 w-16 bg-crete-gold mx-auto mt-3 rounded"></div></div><div class="prose max-w-none text-gray-600 space-y-6"><p>At Crete Developments, we respect your privacy and are committed to protecting your personal data. This privacy policy informs you about how we handle your personal data when you visit our website or submit inquiries.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">1. Information We Collect</h3><p>We may collect, use, and store your name, email address, and phone number when you fill out contact forms on our website.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">2. How We Use Your Information</h3><p>We use this information to contact you regarding your inquiries, send you project updates, and assist you in finding your dream properties.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">3. Data Protection</h3><p>We implement appropriate technical and organizational security measures to protect your personal data from unauthorized access, loss, alteration, or disclosure.</p></div></div>',
                'content_ar' => '<div class="max-w-4xl mx-auto py-12 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8" dir="rtl"><div class="text-center mb-8"><h1 class="text-3xl font-extrabold text-crete-blue" style="font-family: \'Playfair Display\', serif;">سياسة الخصوصية</h1><div class="h-1 w-16 bg-crete-gold mx-auto mt-3 rounded"></div></div><div class="prose max-w-none text-gray-600 space-y-6"><p>في كريت للتطوير العقاري، نحن نحترم خصوصيتك وملتزمون بحماية بياناتك الشخصية. توضح سياسة الخصوصية هذه كيفية التعامل مع بياناتك عند زيارة موقعنا أو تقديم الاستفسارات.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">١. البيانات التي نجمعها</h3><p>قد نجمع ونخزن ونستخدم اسمك وبريدك الإلكتروني ورقم هاتفك عندما تقوم بملء النماذج على موقعنا الإلكتروني.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">٢. كيفية استخدام بياناتك</h3><p>نحن نستخدم هذه البيانات للتواصل معك بخصوص استفساراتك، إرسال تحديثات المشاريع، ومساعدتك في اختيار عقارك الأمثل.</p><h3 class="text-xl font-bold text-crete-blue border-b border-gray-100 pb-2">٣. حماية البيانات</h3><p>نحن نطبق إجراءات فنية وتنظيمية مناسبة لحماية بياناتك الشخصية من الوصول غير المصرح به أو الفقدان أو التعديل أو الإفصاح.</p></div></div>',
                'status' => 1
            ]
        );

        // Contact Us Page
        Page::updateOrCreate(
            ['slug' => 'contact-us'],
            [
                'title_en' => 'Contact Us',
                'title_ar' => 'اتصل بنا',
                'content_en' => '',
                'content_ar' => '',
                'status' => 1,
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
                            'show_form' => true,
                            'show_details' => true
                        ]
                    ]
                ]
            ]
        );

        // 2. Project Types
        $commercialType = ProjectType::updateOrCreate(
            ['slug' => 'commercial'],
            ['name_en' => 'Commercial', 'name_ar' => 'تجاري', 'is_active' => true]
        );

        // 3. Projects
        $nineMall = Project::updateOrCreate(
            ['slug' => 'nine-mall'],
            [
                'title_en' => 'Nine Mall',
                'title_ar' => 'ناين مول',
                'description_en' => '<p>Nine Mall is located on Al-Thaqafa Main Street, in one of the most densely populated districts, with a 100-meter frontage directly on the main road—helping our valued clients achieve the highest returns. We also considered the highest international design standards in both the interior and exterior design to maximize return on investment for our clients.</p><ul><li>Project Area: 2100m²</li><li>Number of Units: 96</li><li>Project Start Date: August 2025</li><li>Delivery Date: June 2027</li></ul>',
                'description_ar' => '<p>يقع المول على شارع الثقافة الرئيسي، في واحدة من أكثر المناطق كثافةً سكانية، ويتمتع بواجهة بطول 100 متر مباشرةً على الطريق الرئيسي—مما يساعد عملاءنا الكرام على تحقيق أعلى العوائد. كما راعينا أعلى المعايير العالمية in التصميم، سواء في التصميم الداخلي أو الخارجي، بهدف تعظيم العائد على الاستثمار لعملائنا.</p><ul><li>مساحة المشروع: 2100 م²</li><li>عدد الوحدات: 96</li><li>تاريخ بدء المشروع: أغسطس 2025</li><li>تاريخ التسليم: يونيو 2027</li></ul>',
                'location' => 'Obour City, Egypt',
                'location_ar' => 'مدينة العبور، مصر',
                'status' => true,
                'featured' => true,
                'price' => 0.00,
                'area' => 2100.00,
                'bedrooms' => null,
                'developer' => 'Crete Developments',
                'project_type_id' => $commercialType->id,
                'views_count' => 120
            ]
        );

        $trafficMall = Project::updateOrCreate(
            ['slug' => 'traffic-mall'],
            [
                'title_en' => 'Traffic Mall',
                'title_ar' => 'ترافيك مول',
                'description_en' => '<p>Traffic Mall is located in a high-traffic, densely populated area in Obour City. It offers retail, offices, and medical units on a prime 1,100 sqm corner plot with open frontage on key roads in the Second Neighborhood—designed for strong demand and solid returns.</p><ul><li>Project Area: 1100m²</li><li>Number of Units: 74</li><li>Project Start Date: May 2025</li><li>Delivery Date: June 2027</li></ul>',
                'description_ar' => '<p>يقع Traffic Mall في منطقة حيوية عالية الحركة وكثيفة السكان بمدينة العبور. يوفر المشروع وحدات تجارية ومكاتب وطبية على قطعة أرض مميزة بمساحة 1,100 م² عند ناصية، مع واجهات مفتوحة على طرق رئيسية في الحي الثاني—مصمم لتلبية طلب قوي وتحقيق عوائد مستقرة.</p><ul><li>مساحة المشروع: 1100 م²</li><li>عدد الوحدات: 74</li><li>تاريخ بدء المشروع: مايو 2025</li><li>تاريخ التسليم: يونيو 2027</li></ul>',
                'location' => 'Obour City, Egypt',
                'location_ar' => 'مدينة العبور، مصر',
                'status' => true,
                'featured' => true,
                'price' => 0.00,
                'area' => 1100.00,
                'bedrooms' => null,
                'developer' => 'Crete Developments',
                'project_type_id' => $commercialType->id,
                'views_count' => 85
            ]
        );

        $arenaMall = Project::updateOrCreate(
            ['slug' => 'arena-mall'],
            [
                'title_en' => 'Arena Mall',
                'title_ar' => 'أرينا مول',
                'description_en' => '<p>ARENA MALL spans 2,100 sqm and offers a modern, fully integrated shopping destination. Located on four corners facing main streets, it gives each store an open frontage and strong visibility, and it’s surrounded by gardens for a lively, relaxing atmosphere.</p><ul><li>Project Area: 2100m²</li><li>Number of Units: 76</li><li>Project Start Date: August 2025</li><li>Delivery Date: 2028</li></ul>',
                'description_ar' => '<p>بمساحة تمتد على 2100 متر مربع، يأتي ARENA MALL كوجهة تجارية متكاملة تجمع بين الحداثة، والتميز و الراحة يتميز المول بكونه مقام على 4 نواصي تطل على شوارع رئيسية مما يمنح كل محل واجهة مفتوحة و فرصة عرض استثنائية محاط بحدائق من جميع الاتجاهات لبيئة نابضة بالحياة تجمع بين متعة التسوق و الاسترخاء.</p><ul><li>مساحة المشروع: 2100 م²</li><li>عدد الوحدات: 76</li><li>تاريخ بدء المشروع: أغسطس 2025</li><li>تاريخ التسليم: 2028</li></ul>',
                'location' => 'Obour City, Egypt',
                'location_ar' => 'مدينة العبور، مصر',
                'status' => true,
                'featured' => true,
                'price' => 0.00,
                'area' => 2100.00,
                'bedrooms' => null,
                'developer' => 'Crete Developments',
                'project_type_id' => $commercialType->id,
                'views_count' => 95
            ]
        );

        // 4. Project Images
        ProjectImage::updateOrCreate(
            ['project_id' => $nineMall->id, 'image_path' => 'projects/nine_mall_1.jpg'],
            ['is_primary' => true]
        );
        ProjectImage::updateOrCreate(
            ['project_id' => $nineMall->id, 'image_path' => 'projects/nine_mall_2.jpg'],
            ['is_primary' => false]
        );

        ProjectImage::updateOrCreate(
            ['project_id' => $trafficMall->id, 'image_path' => 'projects/traffic_mall_1.jpg'],
            ['is_primary' => true]
        );
        ProjectImage::updateOrCreate(
            ['project_id' => $trafficMall->id, 'image_path' => 'projects/traffic_mall_2.jpg'],
            ['is_primary' => false]
        );

        ProjectImage::updateOrCreate(
            ['project_id' => $arenaMall->id, 'image_path' => 'projects/arena_mall_1.jpg'],
            ['is_primary' => true]
        );

        // 5. Features
        $features = [
            ['name_en' => 'Parking', 'name_ar' => 'موقف سيارات', 'slug' => 'parking'],
            ['name_en' => '24/7 Security', 'name_ar' => 'أمن 24/7', 'slug' => 'security'],
            ['name_en' => 'Green Areas', 'name_ar' => 'مساحات خضراء', 'slug' => 'green-areas'],
            ['name_en' => 'Sky Restaurant', 'name_ar' => 'مطعم معلق (سماوي)', 'slug' => 'sky-restaurant'],
            ['name_en' => 'Food Court', 'name_ar' => 'منطقة مطاعم', 'slug' => 'food-court'],
            ['name_en' => 'Open Air Gym', 'name_ar' => 'جيم مفتوح', 'slug' => 'open-air-gym'],
            ['name_en' => 'Panoramic Elevators', 'name_ar' => 'مصاعد بانورامية', 'slug' => 'panoramic-elevators'],
            ['name_en' => 'CCTV Systems', 'name_ar' => 'كاميرات مراقبة', 'slug' => 'cctv-systems'],
            ['name_en' => 'Fire Fighting System', 'name_ar' => 'نظام إطفاء حريق متطور', 'slug' => 'fire-fighting-system'],
            ['name_en' => 'EV Charging Station', 'name_ar' => 'محطة شحن سيارات كهربائية', 'slug' => 'ev-charging-station'],
            ['name_en' => 'Plaza', 'name_ar' => 'منطقة بلازا', 'slug' => 'plaza']
        ];
        foreach ($features as $feat) {
            Feature::firstOrCreate(
                ['slug' => $feat['slug']],
                ['name_en' => $feat['name_en'], 'name_ar' => $feat['name_ar'], 'is_active' => true]
            );
        }

        // Associate features
        $nineMallFeatureIds = Feature::whereIn('slug', ['sky-restaurant', 'food-court', 'open-air-gym', 'panoramic-elevators', 'fire-fighting-system'])->pluck('id')->toArray();
        $nineMall->features()->sync($nineMallFeatureIds);

        $trafficMallFeatureIds = Feature::whereIn('slug', ['cctv-systems', 'fire-fighting-system', 'security', 'parking'])->pluck('id')->toArray();
        $trafficMall->features()->sync($trafficMallFeatureIds);

        $arenaMallFeatureIds = Feature::whereIn('slug', ['cctv-systems', 'fire-fighting-system', 'security', 'plaza', 'green-areas'])->pluck('id')->toArray();
        $arenaMall->features()->sync($arenaMallFeatureIds);

        // 6. Settings
        // Company Branches Settings (Only the single real Obour City Head Office)
        $branches = [
            [
                'name_en' => 'Head Office',
                'name_ar' => 'المقر الرئيسي',
                'address_en' => 'El-Obour City, Cairo, Egypt',
                'address_ar' => 'مدينة العبور، القاهرة، مصر',
                'phone' => '19999',
                'email' => 'info@cretedevelopments.com',
                'map_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3451.15783307612!2d31.4795!3d30.2227'
            ]
        ];
        Setting::updateOrCreate(
            ['key' => 'company_branches'],
            ['value' => json_encode($branches)]
        );

        // Company Stats Settings
        $stats = [
            [
                'number' => '75',
                'suffix' => '+',
                'label_en' => 'Residential Buildings',
                'label_ar' => 'عمارة سكنية'
            ],
            [
                'number' => '3',
                'suffix' => '',
                'label_en' => 'Commercial Malls',
                'label_ar' => 'مولات تجارية'
            ],
            [
                'number' => '1997',
                'suffix' => '',
                'label_en' => 'Established Year',
                'label_ar' => 'سنة التأسيس'
            ],
            [
                'number' => '100',
                'suffix' => '%',
                'label_en' => 'Trust & Quality',
                'label_ar' => 'ثقة وجودة'
            ]
        ];
        Setting::updateOrCreate(
            ['key' => 'company_stats'],
            ['value' => json_encode($stats)]
        );

        // Homepage Titles and Legacy Settings
        $homepageSettings = [
            'home_hero_title_en' => 'Crete Developments',
            'home_hero_title_ar' => 'كريت للتطوير العقاري',
            'home_hero_subtitle_en' => 'Premium Real Estate Developments.',
            'home_hero_subtitle_ar' => 'تطوير عقاري فاخر.',
            
            'home_legacy_title_en' => 'Since 1997, Delivering Excellence Across Cairo',
            'home_legacy_title_ar' => 'منذ عام 1997، مسيرة حافلة بالتميز العقاري',
            'home_legacy_desc_en' => 'Since 1997, Crete Developments has delivered over 75 residential buildings across East and West Cairo. In 2025, after an in-depth market study, we expanded into commercial development with Nine Mall, followed by Traffic Mall and Arena Mall. Construction on Nine Mall and Traffic Mall began before the end of 2025.',
            'home_legacy_desc_ar' => 'منذ عام 1997، بدأت رحلتها في مجال التطوير العقاري، ونجحوا خلال هذه السنوات في تسليم أكثر من 75 عمارة سكنية في شرق وغرب القاهرة. وبعد دراسة متعمقة للسوق العقاري، قررنا في عام 2025 التوسع بمحفظة أراضٍ تجارية، لتكون بداية انطلاقتهم في القطاع التجاري من خلال Nine Mall، يليه Traffic Mall، ثم Arena Mall. وقبل نهاية عام 2025، تم البدء فعليًا في أعمال الإنشاءات بمشروعي Nine Mall و Traffic Mall.',
            
            'home_partners' => json_encode([]),
            'home_construction_updates' => json_encode([]),
            'recaptcha_enabled' => '0'
        ];

        foreach ($homepageSettings as $key => $val) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $val]
            );
        }
    }
}
