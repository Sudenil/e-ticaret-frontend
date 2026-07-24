import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './favorites.html',
  styleUrl: './favorites.css',
})
export class Favorites implements OnInit {

  favorites = signal<Product[]>([]);
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

    this.loadFavorites();
  }

  loadFavorites() {

    this.http.get<Product[]>(
      `http://localhost:5281/api/favorite/${this.customerId}`
    ).subscribe({
      next: data => this.favorites.set(data),
      error: err => console.error(err)
    });

  }

  removeFavorite(productId: string) {

    this.http.delete(
      `http://localhost:5281/api/favorite?customerId=${this.customerId}&productId=${productId}`
    ).subscribe(() => {

      this.favorites.update(products =>
        products.filter(p => p.id !== productId)
      );

    });

  }

}