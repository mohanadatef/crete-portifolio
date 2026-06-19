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

    // Skip if already implemented
    if (strpos($content, 'HasMiddleware') !== false) {
        continue;
    }

    // Add imports
    $import = "use Illuminate\\Routing\\Controllers\\HasMiddleware;\nuse Illuminate\\Routing\\Controllers\\Middleware;\n";
    $content = preg_replace('/(use Illuminate\\\\Http\\\\Request;)/', "$1\n$import", $content);

    // Add implements
    $content = preg_replace('/(class [A-Za-z0-9_]+ extends Controller)/', "$1 implements HasMiddleware", $content);

    // Add middleware method
    if ($module === 'settings') {
        $middlewareMethod = <<<PHP

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view-settings', only: ['index', 'show']),
            new Middleware('permission:edit-settings', only: ['store', 'update', 'updateBulk']),
        ];
    }
PHP;
    } else {
        $middlewareMethod = <<<PHP

    public static function middleware(): array
    {
        return [
            new Middleware('permission:view-{$module}', only: ['index', 'show']),
            new Middleware('permission:create-{$module}', only: ['store']),
            new Middleware('permission:edit-{$module}', only: ['update']),
            new Middleware('permission:delete-{$module}', only: ['destroy']),
        ];
    }
PHP;
    }

    $content = preg_replace('/(implements HasMiddleware\s*\{)/', "$1\n$middlewareMethod", $content);

    file_put_contents($fullPath, $content);
    echo "Updated $path\n";
}
