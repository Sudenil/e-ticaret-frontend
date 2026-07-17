import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  errorMessage = signal('');

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.errorMessage.set('');

    this.http.post<any>('http://localhost:5281/api/customer/login', {
      email: this.email,
      password: this.password,
    }).subscribe({
      next: (response) => {
        localStorage.setItem('loggedInUser', JSON.stringify(response));
        this.router.navigate(['/products']);
      },
      error: () => {
        this.errorMessage.set('E-posta veya şifre hatalı.');
      },
    });
  }
}
