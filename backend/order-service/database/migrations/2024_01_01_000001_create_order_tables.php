<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('session_id')->nullable();
            $table->timestamps();
            $table->index('user_id');
            $table->index('session_id');
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cart_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 12, 0);
            $table->timestamps();
            $table->foreign('cart_id')->references('id')->on('carts')->onDelete('cascade');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->unsignedBigInteger('user_id');
            $table->enum('status', ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled', 'returned'])->default('pending');
            $table->decimal('subtotal', 12, 0);
            $table->decimal('voucher_discount', 12, 0)->default(0);
            $table->decimal('shipping_discount', 12, 0)->default(0);
            $table->decimal('points_discount', 12, 0)->default(0);
            $table->decimal('shipping_fee', 12, 0)->default(0);
            $table->decimal('total', 12, 0);
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('shipping_address');
            $table->string('payment_method')->default('cod'); // cod, vnpay
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, refunded
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('variant_id')->nullable();
            $table->string('product_name');
            $table->string('variant_info')->nullable(); // "Red / XL"
            $table->unsignedInteger('quantity');
            $table->decimal('price', 12, 0);
            $table->timestamps();
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('method'); // vnpay, cod
            $table->string('transaction_id')->nullable();
            $table->decimal('amount', 12, 0);
            $table->string('status')->default('pending'); // pending, success, failed
            $table->json('gateway_response')->nullable();
            $table->timestamps();
            $table->index('order_id');
        });

        Schema::create('return_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('user_id');
            $table->text('reason');
            $table->json('proof_images')->nullable();
            $table->enum('status', ['pending', 'reviewing', 'approved', 'rejected', 'refunded'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('shipper_id')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('status')->default('preparing'); // preparing, picked_up, in_transit, delivered, failed
            $table->timestamp('delivered_at')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('return_requests');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};
