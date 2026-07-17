import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

interface Cart {
  id: string;
  customerId: string;
  items: CartItem[];
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartPage implements OnInit {
  cart = signal<Cart | null>(null);
  private customerId = '';

  total = computed(() => {
    const c = this.cart();
    if (!c) return 0;
    return c.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userJson = localStorage.getItem('loggedInUser');
    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }
    const user = JSON.parse(userJson);
    this.customerId = user.id;
    this.loadCart();
  }

  loadCart() {
    this.http.get<Cart>(`http://localhost:5281/api/cart/${this.customerId}`).subscribe({
      next: (data) => this.cart.set(data),
      error: (err) => console.error('Sepet alınamadı:', err),
    });
  }

  removeItem(productId: string) {
    this.http.delete<Cart>(`http://localhost:5281/api/cart/${this.customerId}/items/${productId}`).subscribe({
      next: (data) => this.cart.set(data),
      error: (err) => console.error('Ürün silinemedi:', err),
    });
  }
}
