<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('custom_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('entity_type'); // 'leads', 'projects', 'landing_pages'
            $table->json('config'); // columns, filters, group_by, chart_type
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_reports');
    }
};
