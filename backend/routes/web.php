<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sitemap.xml', function () {
    $projects = \App\Models\Project::where('status', 1)->get();
    
    $content = view('sitemap', [
        'projects' => $projects,
        'frontend_url' => env('FRONTEND_URL', 'http://127.0.0.1:4200')
    ])->render();

    return response($content)->header('Content-Type', 'text/xml');
});
