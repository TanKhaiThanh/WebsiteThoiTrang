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
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->enum('type', ['in', 'out', 'set']); // 'in' = nhập, 'out' = xuất, 'set' = thiết tạo mới
            $table->integer('quantity_changed'); // Số lượng thay đổi (dương)
            $table->integer('balance_after');    // Tồn kho sau giao dịch
            $table->text('note')->nullable();    // Lý do / ghi chú
            $table->string('user_name')->nullable(); // Có thể ghi lại tên người dùng
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
