<?php

$baseDir = __DIR__ . '/app';

$mappings = [
    'Auth' => [
        'Controllers' => ['AuthController'],
        'DTOs' => ['Auth'], // directory
        'Services' => ['AuthService'],
        'Resources' => ['AuthResource']
    ],
    'User' => [
        'Controllers' => ['UserController', 'RoleController'],
        'DTOs' => ['User', 'Role'], // directories
        'Services' => ['UserService', 'RoleService'],
        'Resources' => ['UserResource', 'RoleResource'],
        'Models' => ['User']
    ],
    'Project' => [
        'Controllers' => ['ProjectController'],
        'DTOs' => ['Project'], // directory
        'Services' => ['ProjectService'],
        'Resources' => ['ProjectResource'],
        'Actions' => ['Project'], // directory
        'Models' => ['Project', 'ProjectImage']
    ],
    'Page' => [
        'Controllers' => ['PageController', 'LandingPageController'],
        'DTOs' => ['Page', 'LandingPage'], // directory
        'Services' => ['PageService', 'LandingPageService'],
        'Resources' => ['PageResource', 'LandingPageResource'],
        'Models' => ['Page', 'LandingPage']
    ],
    'Lead' => [
        'Controllers' => ['LeadController'],
        'DTOs' => ['Lead'], // directory
        'Services' => ['LeadService'],
        'Resources' => ['LeadResource'],
        'Actions' => ['Lead'], // directory
        'Models' => ['Lead']
    ],
    'Blog' => [
        'Controllers' => ['BlogPostController', 'BlogCategoryController'],
        'DTOs' => ['Blog'], // directory
        'Services' => ['BlogPostService', 'BlogCategoryService'],
        'Resources' => ['BlogPostResource', 'BlogCategoryResource'],
        'Models' => ['BlogPost', 'BlogCategory']
    ],
    'Setting' => [
        'Controllers' => ['SettingController'],
        'DTOs' => ['Setting'], // directory
        'Services' => ['SettingService'],
        'Resources' => ['SettingResource'],
        'Models' => ['Setting']
    ],
    'Media' => [
        'Controllers' => ['MediaController'],
        'DTOs' => ['Media'], // directory
        'Services' => ['MediaService'],
        'Resources' => ['MediaResource'],
        'Models' => ['Media']
    ],
];

// Helper to move file or directory
function moveItem($type, $item, $module) {
    global $baseDir;
    
    // Some are directories (like DTOs/Auth, Actions/Project)
    $isDir = in_array($type, ['DTOs', 'Actions']);
    
    if ($type === 'Controllers') $source = "$baseDir/Http/Controllers/$item.php";
    elseif ($type === 'Resources') $source = "$baseDir/Http/Resources/$item.php";
    elseif ($isDir) $source = "$baseDir/$type/$item";
    else $source = "$baseDir/$type/$item.php";
    
    if ($isDir) {
        $dest = "$baseDir/Modules/$module/$type";
        if (is_dir($source)) {
            // copy all files inside
            $files = glob("$source/*.php");
            foreach ($files as $file) {
                $basename = basename($file);
                rename($file, "$dest/$basename");
            }
            rmdir($source);
        }
    } else {
        $dest = "$baseDir/Modules/$module/$type/$item.php";
        if (file_exists($source)) {
            rename($source, $dest);
        }
    }
}

foreach ($mappings as $module => $types) {
    foreach ($types as $type => $items) {
        foreach ($items as $item) {
            moveItem($type, $item, $module);
        }
    }
}

echo "Files moved.\n";

// Now, recursively update all namespaces and use statements in app/
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseDir));

$namespaceMap = [
    'App\Http\Controllers' => 'App\Modules\*\Controllers',
    'App\DTOs\Auth' => 'App\Modules\Auth\DTOs',
    'App\DTOs\User' => 'App\Modules\User\DTOs',
    'App\DTOs\Role' => 'App\Modules\User\DTOs',
    'App\DTOs\Project' => 'App\Modules\Project\DTOs',
    'App\DTOs\Page' => 'App\Modules\Page\DTOs',
    'App\DTOs\LandingPage' => 'App\Modules\Page\DTOs',
    'App\DTOs\Lead' => 'App\Modules\Lead\DTOs',
    'App\DTOs\Blog' => 'App\Modules\Blog\DTOs',
    'App\DTOs\Setting' => 'App\Modules\Setting\DTOs',
    'App\DTOs\Media' => 'App\Modules\Media\DTOs',
    'App\Services' => 'App\Modules\*\Services',
    'App\Http\Resources' => 'App\Modules\*\Resources',
    'App\Actions\Lead' => 'App\Modules\Lead\Actions',
    'App\Actions\Project' => 'App\Modules\Project\Actions',
    'App\Models' => 'App\Modules\*\Models',
];

// Determine specific target module for generic replacements
function getModuleForClass($classType, $className, $mappings) {
    foreach ($mappings as $module => $types) {
        if (isset($types[$classType])) {
            if ($classType === 'DTOs' || $classType === 'Actions') {
                // these are directories, but we just mapped them to string
                // handled by specific maps above
            } else {
                if (in_array($className, $types[$classType])) {
                    return $module;
                }
            }
        }
    }
    return null;
}

foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $content = file_get_contents($file->getPathname());
        $original = $content;
        
        // 1. Update its own namespace
        if (preg_match('/namespace\s+App\\\\([^;]+);/', $content, $matches)) {
            $oldNamespace = $matches[1];
            // If it's inside Modules, we just let it be. But wait, moving files didn't change their contents.
            // So they still have 'namespace App\Http\Controllers;' etc.
            // We need to fix the namespace of files inside App/Modules
            if (strpos($file->getPathname(), 'Modules') !== false) {
                // path is .../app/Modules/Project/Controllers/ProjectController.php
                // namespace should be App\Modules\Project\Controllers
                $relativePath = substr($file->getPathname(), strlen($baseDir) + 1);
                $newNamespace = 'App\\' . str_replace('/', '\\', dirname($relativePath));
                $content = preg_replace('/namespace\s+App\\\\[^;]+;/', "namespace $newNamespace;", $content);
            }
        }

        // 2. Update `use` statements
        $lines = explode("\n", $content);
        foreach ($lines as &$line) {
            if (preg_match('/^use\s+App\\\\([^;]+);/', $line, $matches)) {
                $usedClass = $matches[1]; // e.g. Models\User
                $parts = explode('\\', $usedClass);
                $typeFolder = $parts[0]; // Models
                $className = end($parts); // User
                
                $classTypeMap = [
                    'Models' => 'Models',
                    'Services' => 'Services',
                    'Http\Controllers' => 'Controllers',
                    'Http\Resources' => 'Resources',
                    'DTOs' => 'DTOs',
                    'Actions' => 'Actions'
                ];
                
                $searchType = null;
                if ($typeFolder === 'Http' && isset($parts[1])) {
                    if ($parts[1] === 'Controllers') $searchType = 'Controllers';
                    if ($parts[1] === 'Resources') $searchType = 'Resources';
                } elseif (isset($classTypeMap[$typeFolder])) {
                    $searchType = $classTypeMap[$typeFolder];
                }
                
                if ($searchType) {
                    if ($searchType === 'DTOs' || $searchType === 'Actions') {
                        // find which module has this dto folder in mappings
                        $folderName = $parts[1]; // e.g. User from DTOs\User\UserDTO
                        foreach ($mappings as $m => $t) {
                            if (isset($t[$searchType]) && in_array($folderName, $t[$searchType])) {
                                $line = "use App\\Modules\\$m\\$searchType\\$className;";
                                break;
                            }
                        }
                    } else {
                        $module = getModuleForClass($searchType, $className, $mappings);
                        if ($module) {
                            $line = "use App\\Modules\\$module\\$searchType\\$className;";
                        }
                    }
                }
            }
        }
        $content = implode("\n", $lines);

        if ($content !== $original) {
            file_put_contents($file->getPathname(), $content);
        }
    }
}

// Clean up old empty directories
@rmdir("$baseDir/Http/Controllers");
@rmdir("$baseDir/Http/Resources");
@rmdir("$baseDir/Http");
@rmdir("$baseDir/DTOs");
@rmdir("$baseDir/Actions");
@rmdir("$baseDir/Models");
@rmdir("$baseDir/Services");

echo "Refactoring complete.\n";

