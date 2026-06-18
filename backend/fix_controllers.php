<?php
$files = glob('app/Modules/*/Controllers/*.php');
foreach($files as $f) {
    $c = file_get_contents($f);
    if (strpos($c, 'extends Controller') !== false && strpos($c, 'use App\\Http\\Controllers\\Controller;') === false) {
        $c = preg_replace('/(namespace App\\\\Modules\\\\[^;]+;)/', "$1\n\nuse App\\Http\\Controllers\\Controller;", $c);
        file_put_contents($f, $c);
        echo "Fixed $f\n";
    }
}
