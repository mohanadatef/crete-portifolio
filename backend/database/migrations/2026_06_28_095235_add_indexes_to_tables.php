<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->index(['status', 'featured', 'created_at']);
            $table->index('project_type_id');
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->index('status');
            $table->index('assigned_to');
            $table->index('landing_page_id');
            $table->index('created_at');
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->index('status');
            $table->index('blog_category_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['status', 'featured', 'created_at']);
            $table->dropIndex(['project_type_id']);
        });

        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['assigned_to']);
            $table->dropIndex(['landing_page_id']);
            $table->dropIndex(['created_at']);
        });

        Schema::table('blog_posts', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['blog_category_id']);
            $table->dropIndex(['created_at']);
        });
    }
};
