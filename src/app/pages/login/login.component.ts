import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService, LoginDto } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private i18n = inject(TranslateService);

  // Modele du formulaire (signal pour reactivite en mode zoneless)
  email = signal('');
  password = signal('');

  errorMessage = signal('');
  isLoading = signal(false);

  onSubmit(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    const dto: LoginDto = {
      email: this.email(),
      password: this.password(),
    };

    this.authService.login(dto).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigateByUrl('/dashboard');
      },
      error: (error) => {
        this.isLoading.set(false);

        if (error.status === 401) {
          this.errorMessage.set(this.i18n.instant('LOGIN.ERR_INVALID'));
        } else if (error.status === 400) {
          this.errorMessage.set(this.i18n.instant('LOGIN.ERR_BAD_REQUEST'));
        } else {
          this.errorMessage.set(this.i18n.instant('LOGIN.ERR_GENERIC'));
        }
      },
    });
  }
}
