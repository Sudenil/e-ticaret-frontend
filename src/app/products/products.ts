import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory?: string;
  type?: string;
  style?: string;
  color?: string;
  sizes?: string[];
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
  selectedSubCategory = signal<string>('Tümü');
  selectedType = signal<string>('Tümü');
  selectedStyle = signal<string>('Tümü');

  selectedSizes = signal<Record<string, string>>({});

  quantities = signal<Record<string, number>>({});

  searchQuery = signal<string>('');

  showAccountMenu = signal(false);

  customerName = '';
  private customerId = '';

  // Favori ürün id'leri
  favoriteIds = signal<string[]>([]);
  cartItemCount = signal<number>(0);

  // Sayfalama / infinite scroll
  page = signal(1);
  pageSize = 20;
  loadingMore = signal(false);
  hasMore = signal(true);

  categories = computed(() => {
    const cats = new Set(this.products().map(p => p.category));
    return ['Tümü', ...Array.from(cats)];
  });

  types = computed(() => {
    const list = this.products().filter(
      p => p.subCategory === this.selectedSubCategory()
    );
    const t = new Set(
      list.map(p => p.type).filter((x): x is string => !!x)
    );
    return ['Tümü', ...Array.from(t)];
  });

  styles = computed(() => {
    const list = this.products().filter(
      p =>
        p.subCategory === this.selectedSubCategory() &&
        p.type === this.selectedType()
    );

    const s = new Set(
      list.map(p => p.style).filter((x): x is string => !!x)
    );

    return ['Tümü', ...Array.from(s)];
  });

  filteredProducts = computed(() => {

    let list = this.products();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(query)
      );
    }

    if (this.selectedCategory() !== 'Tümü') {
      list = list.filter(
        p => p.category === this.selectedCategory()
      );
    }

    if (this.selectedCategory() === 'Giyim') {

      if (this.selectedSubCategory() !== 'Tümü') {
        list = list.filter(
          p => p.subCategory === this.selectedSubCategory()
        );
      }

      if (this.selectedType() !== 'Tümü') {
        list = list.filter(
          p => p.type === this.selectedType()
        );
      }

      if (this.selectedStyle() !== 'Tümü') {
        list = list.filter(
          p => p.style === this.selectedStyle()
        );
      }
    }

    return list;
  });

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
    this.customerName = user.fullName;

    this.loadNextPage();
    this.loadFavorites();
    this.loadCartCount();
  }

  loadCartCount() {
    this.http.get<{ items: { quantity: number }[] }>(
      `http://localhost:5281/api/cart/${this.customerId}`
    ).subscribe({
      next: cart => {
        const total = (cart.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
        this.cartItemCount.set(total);
      },
      error: err => console.error(err)
    });
  }

  loadNextPage() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);

    this.http.get<{ items: Product[]; totalCount: number }>(
      `http://localhost:5281/api/product/paged?page=${this.page()}&pageSize=${this.pageSize}`
    ).subscribe({
      next: result => {
        this.products.update(prev => [...prev, ...result.items]);
        this.hasMore.set(this.products().length < result.totalCount);
        this.page.update(p => p + 1);
        this.loadingMore.set(false);
      },
      error: err => {
        console.error(err);
        this.loadingMore.set(false);
      }
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    const scrolledToBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;
    if (scrolledToBottom) this.loadNextPage();
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.selectedSubCategory.set('Tümü');
    this.selectedType.set('Tümü');
    this.selectedStyle.set('Tümü');
  }

  selectSubCategory(sub: string) {
    this.selectedSubCategory.set(sub);
    this.selectedType.set('Tümü');
    this.selectedStyle.set('Tümü');
  }

  selectType(type: string) {
    this.selectedType.set(type);
    this.selectedStyle.set('Tümü');
  }

  selectStyle(style: string) {
    this.selectedStyle.set(style);
  }

  selectSize(productId: string, size: string) {
    this.selectedSizes.update(current => ({
      ...current,
      [productId]: size
    }));
  }

  getQuantity(productId: string): number {
    return this.quantities()[productId] ?? 1;
  }

  increaseQuantity(productId: string) {
    this.quantities.update(current => ({
      ...current,
      [productId]: (current[productId] ?? 1) + 1
    }));
  }

  decreaseQuantity(productId: string) {
    this.quantities.update(current => {
      const qty = current[productId] ?? 1;
      return { ...current, [productId]: Math.max(1, qty - 1) };
    });
  }

  toggleAccountMenu() {
    this.showAccountMenu.set(!this.showAccountMenu());
  }

  logout() {
    localStorage.removeItem('loggedInUser');
    this.router.navigate(['/login']);
  }

  addToCart(product: Product) {

    const size = this.selectedSizes()[product.id];

    if (product.sizes?.length && !size) {
      this.message.set('Lütfen bir beden seçin!');
      setTimeout(() => this.message.set(''), 2000);
      return;
    }

    const quantity = this.getQuantity(product.id);

    this.http.post(
      `http://localhost:5281/api/cart/${this.customerId}/items`,
      {
        productId: product.id,
        quantity: quantity,
        size: size ?? null
      }
    ).subscribe({
     next: (cart: any) => {
        this.message.set(`${product.name} sepete eklendi!`);
        setTimeout(() => this.message.set(''), 2000);

        const total = (cart.items ?? []).reduce((sum: number, item: any) => sum + item.quantity, 0);
        this.cartItemCount.set(total);
      },
      error: err => console.error(err)
    });
  }

 loadFavorites() {

  this.http.get<any[]>(
    `http://localhost:5281/api/favorite/${this.customerId}`
  ).subscribe({
    next: favorites => {

      this.favoriteIds.set(
        favorites.map(f => f.id)
      );

    },
    error: err => console.error(err)
  });

}

  isFavorite(productId: string) {
    return this.favoriteIds().includes(productId);
  }

  toggleFavorite(product: Product) {

    if (this.isFavorite(product.id)) {

      this.http.delete(
        `http://localhost:5281/api/favorite?customerId=${this.customerId}&productId=${product.id}`
      ).subscribe(() => {

        this.favoriteIds.update(ids =>
          ids.filter(id => id !== product.id)
        );

      });

    } else {

      this.http.post(
        `http://localhost:5281/api/favorite`,
        {
          customerId: this.customerId,
          productId: product.id
        }
      ).subscribe(() => {

        this.favoriteIds.update(ids => [
          ...ids,
          product.id
        ]);

      });

    }

  }

}