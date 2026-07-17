import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  fullName = '';
  email = '';
  password = '';
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.http.post<any>('http://localhost:5281/api/customer/register', {
      fullName: this.fullName,
      email: this.email,
      password: this.password,
    }).subscribe({
      next: () => {
        this.successMessage.set('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Kayıt sırasında bir hata oluştu.');
      },
    });
  }
}
