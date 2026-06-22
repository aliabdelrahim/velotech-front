import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);

  email = signal('');
  emailError = signal<string | null>(null);
  submitting = signal(false);
  sent = signal(false);
  devToken = signal<string | null>(null); // affiche en dev pour faciliter les tests

  onSubmit(): void {
    this.emailError.set(null);
    const e = this.email().trim();
    if (!e) {
      this.emailError.set('Email requis');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      this.emailError.set("Format d'email invalide");
      return;
    }

    this.submitting.set(true);
    this.auth.forgotPassword(e).subscribe({
      next: (res) => {
        this.sent.set(true);
        this.submitting.set(false);
        if (res.devToken) this.devToken.set(res.devToken);
      },
      error: () => {
        // Meme en cas d'erreur on affiche le meme message (anti-enumeration)
        this.sent.set(true);
        this.submitting.set(false);
      },
    });
  }
}
