import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginDto } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  model: LoginDto = {
    email: '',
    password: '',
  };

  errorMessage = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.model).subscribe({
      next: (response) => {
        console.log('Connexion réussie', response);
        this.isLoading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage = 'Email ou mot de passe incorrect.';
        } else if (error.status === 400) {
          this.errorMessage = 'Veuillez remplir correctement les champs.';
        } else {
          this.errorMessage = 'Une erreur est survenue.';
        }
      },
    });
  }
}