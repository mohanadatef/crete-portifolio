<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Modules\User\Models\User::where('email', 'admin@admin.com')->first();
echo "User permissions:\n";
foreach ($user->getAllPermissions() as $p) {
    echo $p->name . "\n";
}
