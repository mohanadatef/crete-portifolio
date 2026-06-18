<?php
$content = file_get_contents('routes/api.php');
$content = str_replace('App\\Http\\Controllers\\AuthController', 'App\\Modules\\Auth\\Controllers\\AuthController', $content);
$content = str_replace('App\\Http\\Controllers\\UserController', 'App\\Modules\\User\\Controllers\\UserController', $content);
$content = str_replace('App\\Http\\Controllers\\RoleController', 'App\\Modules\\User\\Controllers\\RoleController', $content);
$content = str_replace('App\\Http\\Controllers\\ProjectController', 'App\\Modules\\Project\\Controllers\\ProjectController', $content);
$content = str_replace('App\\Http\\Controllers\\PageController', 'App\\Modules\\Page\\Controllers\\PageController', $content);
$content = str_replace('App\\Http\\Controllers\\LandingPageController', 'App\\Modules\\Page\\Controllers\\LandingPageController', $content);
$content = str_replace('App\\Http\\Controllers\\LeadController', 'App\\Modules\\Lead\\Controllers\\LeadController', $content);
$content = str_replace('App\\Http\\Controllers\\BlogCategoryController', 'App\\Modules\\Blog\\Controllers\\BlogCategoryController', $content);
$content = str_replace('App\\Http\\Controllers\\BlogPostController', 'App\\Modules\\Blog\\Controllers\\BlogPostController', $content);
$content = str_replace('App\\Http\\Controllers\\SettingController', 'App\\Modules\\Setting\\Controllers\\SettingController', $content);
$content = str_replace('App\\Http\\Controllers\\MediaController', 'App\\Modules\\Media\\Controllers\\MediaController', $content);
file_put_contents('routes/api.php', $content);
echo "Routes updated\n";
