import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
}

interface Cart {
  customerId: string;
  items: CartItem[];
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css'
})
export class CartPage implements OnInit {

  cart = signal<Cart | null>(null);
  shipping = 59.99;
  orderConfirmed = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const userJson = localStorage.getItem('loggedInUser');

    if (!userJson) return;

    const user = JSON.parse(userJson);

    this.http.get<Cart>(`http://localhost:5281/api/cart/${user.id}`)
      .subscribe({
        next: data => this.cart.set(data),
        error: err => console.error(err)
      });
  }

  removeItem(productId: string) {
    const userJson = localStorage.getItem('loggedInUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);

    this.http.delete(
      `http://localhost:5281/api/cart/${user.id}/items/${productId}`
    ).subscribe({
      next: () => {
        const current = this.cart();

        if (!current) return;

        this.cart.set({
          ...current,
          items: current.items.filter(item => item.productId !== productId)
        });
      },
      error: err => console.error(err)
    });
  }

  total(): number {
    const current = this.cart();

    if (!current) return 0;

    return current.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }

  confirmOrder() {
    const userJson = localStorage.getItem('loggedInUser');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const current = this.cart();

    if (!current || current.items.length === 0) return;

    const deleteRequests = current.items.map(item =>
      this.http.delete(
        `http://localhost:5281/api/cart/${user.id}/items/${item.productId}`
      )
    );

    forkJoin(deleteRequests).subscribe({
      next: () => {
        this.orderConfirmed.set(true);
        this.cart.set({ ...current, items: [] });
      },
      error: err => console.error(err)
    });
  }
}