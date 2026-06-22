import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService, UpdateProfileDto, UserDetailsDto } from '../../services/user';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface ProfileModel {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);

  loading = signal(true);
  loadError = signal<string | null>(null);

  user = signal<UserDetailsDto | null>(null);
  model = signal<ProfileModel>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  errors = signal<FieldErrors>({});
  serverError = signal<string | null>(null);
  successMsg = signal<string | null>(null);
  submitting = signal(false);

  ngOnInit(): void {
    this.userService.getMe().subscribe({
      next: (u) => {
        this.user.set(u);
        this.model.update((m) => ({ ...m, name: u.name, email: u.email }));
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Impossible de charger votre profil.');
        this.loading.set(false);
      },
    });
  }

  set<K extends keyof ProfileModel>(key: K, value: ProfileModel[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};

    if (!m.name.trim() || m.name.trim().length < 2) {
      e.name = 'Le nom doit contenir au moins 2 caracteres';
    }
    if (!m.email.trim()) {
      e.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
      e.email = "Format d'email invalide";
    }

    // Validation mot de passe : seulement si l'utilisateur veut le changer
    const wantsChange = !!(m.currentPassword || m.newPassword || m.confirmNewPassword);
    if (wantsChange) {
      if (!m.currentPassword) {
        e.currentPassword = 'Saisissez votre mot de passe actuel';
      }
      if (!m.newPassword || m.newPassword.length < 6) {
        e.newPassword = 'Nouveau mot de passe : 6 caracteres minimum';
      }
      if (m.newPassword !== m.confirmNewPassword) {
        e.confirmNewPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    return e;
  }

  onSubmit(form: NgForm): void {
    this.serverError.set(null);
    this.successMsg.set(null);
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    const m = this.model();
    const wantsChange = !!m.newPassword;
    const dto: UpdateProfileDto = {
      name: m.name.trim(),
      email: m.email.trim(),
      currentPassword: wantsChange ? m.currentPassword : null,
      newPassword: wantsChange ? m.newPassword : null,
    };

    this.submitting.set(true);
    this.userService.updateMe(dto).subscribe({
      next: (u) => {
        this.user.set(u);
        this.model.update((mm) => ({
          ...mm,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }));
        this.successMsg.set('Profil mis a jour avec succes.');
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || 'Erreur lors de la mise a jour.');
      },
    });
  }
}
