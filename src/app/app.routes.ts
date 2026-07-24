import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Products } from './products/products';
import { Register } from './register/register';
import { CartPage } from './cart/cart';
import { Favorites } from './favorites/favorites';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'products', component: Products },
  { path: 'cart', component: CartPage },
  { path: 'favorites',component: Favorites},
   
];