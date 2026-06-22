import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterDto } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface RegisterModel {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  model = signal<RegisterModel>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
  });

  errors = signal<FieldErrors>({});
  serverError = signal<string | null>(null);
  submitting = signal(false);
  success = signal(false);

  passwordStrength = computed(() => {
    const pwd = this.model().password;
    if (!pwd) return { label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { label: 'Faible', color: 'weak' };
    if (score <= 4) return { label: 'Moyen', color: 'medium' };
    return { label: 'Fort', color: 'strong' };
  });

  set<K extends keyof RegisterModel>(key: K, value: RegisterModel[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};

    if (!m.name.trim() || m.name.trim().length < 2) {
      e.name = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!m.email.trim()) {
      e.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
      e.email = 'Format d\'email invalide';
    }
    if (!m.password) {
      e.password = 'Mot de passe requis';
    } else if (m.password.length < 6) {
      e.password = 'Au moins 6 caractères';
    }
    if (m.password !== m.confirmPassword) {
      e.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!m.acceptedTerms) {
      e.terms = 'Vous devez accepter les conditions';
    }
    return e;
  }

  onSubmit(form: NgForm): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    this.submitting.set(true);
    const m = this.model();
    const dto: RegisterDto = {
      name: m.name.trim(),
      email: m.email.trim(),
      password: m.password,
    };

    this.auth.register(dto).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);
        // Auto-login avec les memes identifiants
        setTimeout(() => {
          this.auth.login({ email: dto.email, password: dto.password }).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => this.router.navigate(['/login']),
          });
        }, 1500);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || 'Erreur lors de l\'inscription. Réessayez.');
      },
    });
  }
}
