import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserDetailsDto,
  UserService,
  CreateUserDto,
  UpdateUserDto,
} from '../../../services/user';
import { RoleService, RoleDto } from '../../../services/role';
import { StoreService, StoreDetailsDto } from '../../../services/store';
import { AuthService } from '../../../services/auth';
import { forkJoin } from 'rxjs';

/** Modele du formulaire user (create + edit). */
interface UserFormModel {
  name: string;
  email: string;
  password: string;
  roleId: number | null;
  storeId: number | null;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.html',
  styleUrls: ['../../back-office/bo-orders/bo-orders.scss', './admin-users.scss'],
})
export class AdminUsersComponent implements OnInit {
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private storeService = inject(StoreService);
  private auth = inject(AuthService);

  users = signal<UserDetailsDto[]>([]);
  roles = signal<RoleDto[]>([]);
  stores = signal<StoreDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  // --- Filtres ---
  searchTerm = signal('');
  roleFilter = signal<string>('all');
  /** Affiche aussi les comptes supprimes (soft-deleted) dans la liste. */
  showDeleted = signal(false);

  // --- Modal ---
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingUserId = signal<number | null>(null);
  modalModel = signal<UserFormModel>(this.emptyForm());
  modalError = signal<string | null>(null);
  modalSubmitting = signal(false);

  // --- Confirmation de suppression ---
  showDeleteConfirm = signal(false);
  userToDelete = signal<UserDetailsDto | null>(null);
  deleting = signal(false);

  availableRoles = computed(() => {
    const names = new Set<string>(this.users().map((u) => u.roleName).filter(Boolean));
    return ['all', ...Array.from(names).sort()];
  });

  filtered = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const role = this.roleFilter();
    const includeDeleted = this.showDeleted();
    return this.users().filter((u) => {
      // Par defaut on cache les comptes supprimes (soft delete).
      // L'admin peut activer le toggle pour les voir (audit RGPD, traçabilite).
      if (!includeDeleted && u.isDeleted) return false;
      if (role !== 'all' && u.roleName !== role) return false;
      if (!q) return true;
      return (
        String(u.id).includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.storeName ?? '').toLowerCase().includes(q)
      );
    });
  });

  /** Nombre de comptes supprimes dans la base (pour l'afficher dans le toggle). */
  deletedCount = computed(() =>
    this.users().filter((u) => u.isDeleted).length
  );

  /** Role selectionne dans le formulaire modal — pour afficher/cacher StoreId. */
  selectedRoleName = computed(() => {
    const id = this.modalModel().roleId;
    return this.roles().find((r) => r.id === id)?.name ?? '';
  });

  needsStore = computed(() => {
    const r = this.selectedRoleName();
    return r !== '' && r !== 'Client';
  });

  /** ID du user connecte (pour empecher l'auto-suppression). */
  currentUserId = Number(this.auth.getUserId()) || 0;

  ngOnInit(): void {
    this.loadAll();
  }

  private emptyForm(): UserFormModel {
    return { name: '', email: '', password: '', roleId: null, storeId: null };
  }

  private loadAll(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    forkJoin({
      users: this.userService.getAll(),
      roles: this.roleService.getAll(),
      stores: this.storeService.getAll(),
    }).subscribe({
      next: ({ users, roles, stores }) => {
        this.users.set(users);
        this.roles.set(roles);
        this.stores.set(stores);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger les donnees.');
        this.loading.set(false);
      },
    });
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'badge-warning';
      case 'Manager': return 'badge-success';
      case 'Tech': return 'badge-info';
      case 'Client': return 'badge-info';
      default: return 'badge-info';
    }
  }

  /** Affiche "Technicien" dans l'UI au lieu du nom technique "Tech". */
  roleLabel(role: string): string {
    switch (role) {
      case 'Tech': return 'Technicien';
      case 'Admin': return 'Administrateur';
      case 'Manager': return 'Manager';
      case 'Client': return 'Client';
      default: return role;
    }
  }

  // ========== Modal create / edit ==========

  openCreate(): void {
    this.modalMode.set('create');
    this.editingUserId.set(null);
    this.modalModel.set(this.emptyForm());
    this.modalError.set(null);
    this.showModal.set(true);
  }

  openEdit(u: UserDetailsDto): void {
    this.modalMode.set('edit');
    this.editingUserId.set(u.id);
    this.modalModel.set({
      name: u.name,
      email: u.email,
      password: '',
      roleId: u.roleId,
      storeId: u.storeId > 0 ? u.storeId : null,
    });
    this.modalError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.modalSubmitting()) return;
    this.showModal.set(false);
  }

  setField<K extends keyof UserFormModel>(key: K, value: UserFormModel[K]): void {
    this.modalModel.update((m) => ({ ...m, [key]: value }));
  }

  /** Validation cote front avant envoi. */
  private validate(): string | null {
    const m = this.modalModel();
    if (!m.name.trim()) return 'Le nom est requis.';
    if (!m.email.trim()) return 'L\'email est requis.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim())) return 'Email invalide.';
    if (!m.roleId) return 'Le role est requis.';
    if (this.modalMode() === 'create') {
      if (!m.password || m.password.length < 6)
        return 'Le mot de passe doit faire au moins 6 caracteres.';
    } else {
      if (m.password && m.password.length < 6)
        return 'Le nouveau mot de passe doit faire au moins 6 caracteres.';
    }
    if (this.needsStore() && !m.storeId)
      return 'Le magasin est requis pour un compte staff.';
    return null;
  }

  submitModal(): void {
    const err = this.validate();
    if (err) {
      this.modalError.set(err);
      return;
    }
    this.modalError.set(null);
    this.modalSubmitting.set(true);

    const m = this.modalModel();
    const roleName = this.selectedRoleName();

    if (this.modalMode() === 'create') {
      const dto: CreateUserDto = {
        name: m.name.trim(),
        email: m.email.trim(),
        password: m.password,
        roleId: m.roleId!,
        storeId: roleName === 'Client' ? null : m.storeId,
      };
      this.userService.create(dto).subscribe({
        next: () => {
          this.modalSubmitting.set(false);
          this.showModal.set(false);
          this.loadAll();
        },
        error: (e) => {
          this.modalSubmitting.set(false);
          this.modalError.set(this.extractError(e));
        },
      });
    } else {
      const dto: UpdateUserDto = {
        name: m.name.trim(),
        email: m.email.trim(),
        roleId: m.roleId!,
        storeId: roleName === 'Client' ? null : m.storeId,
        newPassword: m.password?.trim() || null,
      };
      this.userService.update(this.editingUserId()!, dto).subscribe({
        next: () => {
          this.modalSubmitting.set(false);
          this.showModal.set(false);
          this.loadAll();
        },
        error: (e) => {
          this.modalSubmitting.set(false);
          this.modalError.set(this.extractError(e));
        },
      });
    }
  }

  // ========== Suppression ==========

  openDeleteConfirm(u: UserDetailsDto): void {
    this.userToDelete.set(u);
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    if (this.deleting()) return;
    this.showDeleteConfirm.set(false);
    this.userToDelete.set(null);
  }

  confirmDelete(): void {
    const u = this.userToDelete();
    if (!u) return;
    this.deleting.set(true);
    this.userService.delete(u.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.showDeleteConfirm.set(false);
        this.userToDelete.set(null);
        this.loadAll();
      },
      error: (e) => {
        this.deleting.set(false);
        alert(this.extractError(e));
      },
    });
  }

  private extractError(err: any): string {
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return 'Une erreur est survenue.';
  }
}
