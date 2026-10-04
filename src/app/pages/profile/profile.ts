import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, UpdateProfileDto, UserDetailsDto } from '../../services/user';
import { AuthService } from '../../services/auth';
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
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private i18n = inject(TranslateService);

  // Etat de la modale de desinscription
  showDeleteModal = signal(false);
  deletePassword = signal('');
  deleting = signal(false);
  deleteError = signal<string | null>(null);

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
        this.loadError.set(this.i18n.instant('PROFILE.LOAD_ERROR'));
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
      e.name = this.i18n.instant('PROFILE.ERR_NAME');
    }
    if (!m.email.trim()) {
      e.email = this.i18n.instant('PROFILE.ERR_EMAIL');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) {
      e.email = this.i18n.instant('PROFILE.ERR_EMAIL_FORMAT');
    }

    // Validation mot de passe : seulement si l'utilisateur veut le changer
    const wantsChange = !!(m.currentPassword || m.newPassword || m.confirmNewPassword);
    if (wantsChange) {
      if (!m.currentPassword) {
        e.currentPassword = this.i18n.instant('PROFILE.ERR_CURRENT_PWD');
      }
      if (!m.newPassword || m.newPassword.length < 6) {
        e.newPassword = this.i18n.instant('PROFILE.ERR_NEW_PWD');
      }
      if (m.newPassword !== m.confirmNewPassword) {
        e.confirmNewPassword = this.i18n.instant('PROFILE.ERR_CONFIRM_PWD');
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
        this.successMsg.set(this.i18n.instant('PROFILE.SUCCESS'));
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.serverError.set(msg || this.i18n.instant('PROFILE.UPDATE_ERROR'));
      },
    });
  }

  // ===== Desinscription du compte =====

  openDeleteModal(): void {
    this.deletePassword.set('');
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleting()) return;
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    const pwd = this.deletePassword();
    if (!pwd) {
      this.deleteError.set(this.i18n.instant('PROFILE.DELETE_ERR_PWD_REQUIRED'));
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.userService.deleteMyAccount(pwd).subscribe({
      next: () => {
        // Compte supprime : purge du token local + redirection vers l'accueil
        this.auth.logout();
        this.router.navigate(['/'], { queryParams: { accountDeleted: 1 } });
      },
      error: (err) => {
        this.deleting.set(false);
        const msg = typeof err?.error === 'string' ? err.error : err?.error?.message;
        this.deleteError.set(msg || this.i18n.instant('PROFILE.DELETE_ERROR'));
      },
    });
  }
}
