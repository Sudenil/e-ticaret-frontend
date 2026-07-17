import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  products = signal<Product[]>([]);
  message = signal('');
  selectedCategory = signal<string>('Tümü');
  showAccountMenu = signal(false);
  customerName = '';
  private customerId = '';

  categories = computed(() => {
    const cats = new Set(this.products().map((p) => p.category));
    return ['Tümü', ...Array.from(cats)];
  });

  filteredProducts = computed(() => {
    const selected = this.selectedCategory();
    if (selected === 'Tümü') return this.products();
    return this.products().filter((p) => p.category === selected);
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
    this.customerName = user.fullName;

    this.http.get<Product[]>('http://localhost:5281/api/product').subscribe({
      next: (data) => this.products.set(data),
      error: (err) => console.error('Ürünler alınamadı:', err),
    });
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  toggleAccountMenu() {
    this.showAccountMenu.set(!this.showAccountMenu());
  }

  logout() {
    localStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }

  addToCart(product: Product) {
    this.http.post(
      `http://localhost:5281/api/cart/${this.customerId}/items`,
      { productId: product.id, quantity: 1 }
    ).subscribe({
      next: () => {
        this.message.set(`${product.name} sepete eklendi!`);
        setTimeout(() => this.message.set(''), 2000);
      },
      error: (err) => console.error('Sepete eklenemedi:', err),
    });
  }
}