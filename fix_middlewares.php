<?php

$controllers = [
    'User/Controllers/UserController.php' => 'users',
    'User/Controllers/RoleController.php' => 'roles',
    'Project/Controllers/ProjectController.php' => 'projects',
    'ProjectType/Controllers/ProjectTypeController.php' => 'project-types',
    'Page/Controllers/PageController.php' => 'pages',
    'Page/Controllers/LandingPageController.php' => 'landing-pages',
    'Lead/Controllers/LeadController.php' => 'leads',
    'Blog/Controllers/BlogCategoryController.php' => 'blog-categories',
    'Blog/Controllers/BlogPostController.php' => 'blog-posts',
    'Setting/Controllers/SettingController.php' => 'settings',
];

foreach ($controllers as $path => $module) {
    $fullPath = __DIR__ . '/backend/app/Modules/' . $path;
    if (!file_exists($fullPath)) continue;

    $content = file_get_contents($fullPath);

    // Remove implements HasMiddleware
    $content = str_replace(' implements HasMiddleware', '', $content);
    $content = preg_replace('/use Illuminate\\\\Routing\\\\Controllers\\\\HasMiddleware;\nuse Illuminate\\\\Routing\\\\Controllers\\\\Middleware;\n/', '', $content);

    // Remove static middleware method
    $content = preg_replace('/\s*public static function middleware\(\): array\s*\{\s*return \[(.*?)\];\s*\}/s', '', $content);

    // Add __construct if missing
    if (strpos($content, '__construct') === false) {
        $construct = <<<PHP
    public function __construct()
    {
    }
PHP;
        $content = preg_replace('/(class [A-Za-z0-9_]+ extends Controller\s*\{)/', "$1\n$construct\n", $content);
    }

    // Insert $this->middleware inside construct
    if ($module === 'settings') {
        $middleware = <<<PHP
        \$this->middleware('permission:view-settings')->only(['index', 'show']);
        \$this->middleware('permission:edit-settings')->only(['store', 'update', 'updateBulk']);
PHP;
    } else {
        $middleware = <<<PHP
        \$this->middleware('permission:view-{$module}')->only(['index', 'show']);
        \$this->middleware('permission:create-{$module}')->only(['store']);
        \$this->middleware('permission:edit-{$module}')->only(['update']);
        \$this->middleware('permission:delete-{$module}')->only(['destroy']);
PHP;
    }

    $content = preg_replace('/(public function __construct\([^)]*\)\s*\{)/', "$1\n$middleware", $content);

    file_put_contents($fullPath, $content);
    echo "Fixed $path\n";
}
