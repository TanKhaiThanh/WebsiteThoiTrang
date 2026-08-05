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
        Schema::create('shipping_settings', function (Blueprint $table) {
            $table->id();
            $table->integer('zone_1_fee')->default(15000); // Rất gần (Phường trung tâm)
            $table->integer('zone_2_fee')->default(25000); // Gần vừa (Ngoại vi & Lân cận)
            $table->integer('zone_3_fee')->default(35000); // Khá xa (Miền Nam, Tây Nguyên)
            $table->integer('zone_4_fee')->default(45000); // Rất xa (Miền Bắc, Trung)
            $table->integer('free_shipping_threshold')->default(500000); // Miễn phí giao khi Bill > 500k
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipping_settings');
    }
};
