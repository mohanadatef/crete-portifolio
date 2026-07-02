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
        Schema::create('unique_views', function (Blueprint $table) {
            $table->id();
            $table->string('ip_address', 45); // Support IPv6 (max 45 chars)
            $table->string('viewable_type');
            $table->unsignedBigInteger('viewable_id')->nullable();
            $table->timestamps();

            // Add index for fast lookups
            $table->index(['ip_address', 'viewable_type', 'viewable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unique_views');
    }
};
