<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $projects = DB::table('projects')->get();
        foreach ($projects as $project) {
            $images = json_decode($project->images, true);
            if ($images && is_array($images)) {
                foreach ($images as $index => $image) {
                    DB::table('project_images')->insert([
                        'project_id' => $project->id,
                        'image_path' => $image,
                        'is_primary' => $index === 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('images');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('images')->nullable();
        });
    }
};
