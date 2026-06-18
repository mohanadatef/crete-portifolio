<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$request = Illuminate\Http\Request::create('/api/v1/admin/projects', 'POST', [
    'title_ar' => 'Test',
    'title_en' => 'Test',
    'slug' => 'test-project',
    'status' => '1',
    'featured' => '0',
    'price' => '', // This might fail validation
    'area' => ''
]);
$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
