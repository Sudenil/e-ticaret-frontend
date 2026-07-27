import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
}

interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  shipping: number;
  total: number;
  createdAt: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {

  orders = signal<Order[]>([]);
  private customerId = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    const userJson = localStorage.getItem('loggedInUser');

    if (!userJson) {
      this.router.navigate(['/login']);
      return;
    }

    const user = JSON.parse(userJson);
    this.customerId = user.id;

    this.loadOrders();
  }

  loadOrders() {
    this.http.get<Order[]>(
      `http://localhost:5281/api/order/${this.customerId}`
    ).subscribe({
      next: data => this.orders.set(data),
      error: err => console.error(err)
    });
  }
}