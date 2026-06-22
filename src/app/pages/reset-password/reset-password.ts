import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);

  token = signal('');
  newPassword = signal('');
  confirmPassword = signal('');

  errors = signal<FieldErrors>({});
  serverError = signal<string | null>(null);
  submitting = signal(false);
  success = signal(false);

  passwordStrength = computed(() => {
    const pwd = this.newPassword();
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

  ngOnInit(): void {
    const t = this.route.snapshot.paramMap.get('token') ?? '';
    this.token.set(t);
  }

  private validate(): FieldErrors {
    const e: FieldErrors = {};
    const p = this.newPassword();
    if (!p) e.newPassword = 'Nouveau mot de passe requis';
    else if (p.length < 6) e.newPassword = '6 caracteres minimum';
    if (p !== this.confirmPassword()) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    return e;
  }

  onSubmit(): void {
    this.serverError.set(null);
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    if (!this.token()) {
      this.serverError.set('Token manquant. Demandez un nouveau lien de reinitialisation.');
      return;
    }

    this.submitting.set(true);
    this.auth.resetPassword(this.token(), this.newPassword()).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);
        // Redirection vers login apres 2 secondes
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || 'Token invalide ou expire.');
      },
    });
  }
}
