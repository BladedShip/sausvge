<template>
  <div class="app-container">
    <div class="app-content">
      <h1>SVG Vue Shopping Cart</h1>
      <p class="subtitle">Add items to your cart and see the total update</p>

      <div class="products-section">
        <h2>Products</h2>
        <div class="products-grid">
          <div v-for="product in products" :key="product.id" class="product-card">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-price">${{ product.price.toFixed(2) }}</div>
            <button @click="addToCart(product)" class="add-to-cart-btn">
              Add to Cart
            </button>
          </div>
        </div>
      </div>

      <div class="cart-section">
        <h2>Cart ({{ cartItems.length }} items)</h2>
        <div v-if="cartItems.length === 0" class="empty-cart">
          Your cart is empty
        </div>
        <div v-else>
          <div v-for="item in cartItems" :key="item.id" class="cart-item">
            <span class="cart-item-name">{{ item.name }}</span>
            <span class="cart-item-quantity">×{{ item.quantity }}</span>
            <span class="cart-item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
            <button @click="removeFromCart(item.id)" class="remove-btn">Remove</button>
          </div>
          <div class="cart-total">
            <strong>Total: ${{ totalPrice.toFixed(2) }}</strong>
          </div>
          <button @click="clearCart" class="clear-cart-btn">Clear Cart</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Product {
  id: number;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

const products = ref<Product[]>([
  { id: 1, name: 'Laptop', price: 999.99 },
  { id: 2, name: 'Mouse', price: 29.99 },
  { id: 3, name: 'Keyboard', price: 79.99 },
  { id: 4, name: 'Monitor', price: 249.99 },
  { id: 5, name: 'Headphones', price: 149.99 },
  { id: 6, name: 'Webcam', price: 89.99 },
]);

const cartItems = ref<CartItem[]>([]);

function addToCart(product: Product) {
  const existingItem = cartItems.value.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.value.push({ ...product, quantity: 1 });
  }
}

function removeFromCart(productId: number) {
  const index = cartItems.value.findIndex(item => item.id === productId);
  if (index !== -1) {
    if (cartItems.value[index].quantity > 1) {
      cartItems.value[index].quantity -= 1;
    } else {
      cartItems.value.splice(index, 1);
    }
  }
}

function clearCart() {
  cartItems.value = [];
}

const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
});
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 2rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  color: white;
}

.app-content {
  width: 100%;
  max-width: 900px;
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  text-align: center;
  font-size: 1.1rem;
  margin: 0 0 2rem 0;
  opacity: 0.9;
}

.products-section,
.cart-section {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

h2 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.product-card {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
}

.product-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.product-price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #fee140;
}

.add-to-cart-btn {
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #4facfe;
  border: none;
  border-radius: 8px;
  transition: all 0.2s;
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.empty-cart {
  text-align: center;
  padding: 2rem;
  opacity: 0.7;
  font-style: italic;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.cart-item-name {
  flex: 1;
  font-weight: 500;
}

.cart-item-quantity {
  font-size: 0.9rem;
  opacity: 0.8;
}

.cart-item-price {
  font-weight: 600;
  min-width: 80px;
  text-align: right;
}

.remove-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.cart-total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid rgba(255, 255, 255, 0.3);
  text-align: right;
  font-size: 1.5rem;
}

.clear-cart-btn {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: all 0.2s;
}

.clear-cart-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
</style>
