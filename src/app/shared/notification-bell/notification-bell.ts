import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import {
  NotificationService,
  NotificationDto,
} from '../../services/notification';
import { AuthService } from '../../services/auth';

/**
 * Cloche de notifications in-app affichee dans le header pour tout
 * utilisateur connecte. Affiche un badge rouge avec le nombre de notifs
 * non lues et un dropdown avec la liste au clic.
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private auth = inject(AuthService);
  private router = inject(Router);

  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal(0);
  showDropdown = signal(false);
  loading = signal(false);

  private pollingSub?: Subscription;

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) return;
    this.loadUnreadCount();
    // Auto-refresh toutes les 30s pour recuperer les nouvelles notifs
    this.pollingSub = interval(30000).subscribe(() => this.loadUnreadCount());
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

  private loadUnreadCount(): void {
    if (!this.auth.isLoggedIn()) return;
    this.notifService.getUnreadCount().subscribe({
      next: (r) => this.unreadCount.set(r.count),
      error: () => {},
    });
  }

  toggleDropdown(): void {
    const willOpen = !this.showDropdown();
    this.showDropdown.set(willOpen);
    if (willOpen) {
      this.loadNotifications();
    }
  }

  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.notifService.getMine().subscribe({
      next: (list) => {
        this.notifications.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onNotificationClick(n: NotificationDto): void {
    // Marque comme lue puis redirige vers le lien associe
    if (!n.isRead) {
      this.notifService.markAsRead(n.id).subscribe({
        next: () => {
          this.notifications.update((list) =>
            list.map((x) => (x.id === n.id ? { ...x, isRead: true } : x))
          );
          this.unreadCount.update((c) => Math.max(0, c - 1));
        },
      });
    }
    this.closeDropdown();
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) =>
          list.map((n) => ({ ...n, isRead: true }))
        );
        this.unreadCount.set(0);
      },
    });
  }

  iconForType(type: string): string {
    switch (type) {
      case 'RepairCompleted': return '🔧';
      case 'OrderConfirmed': return '🧾';
      case 'RentalReturn': return '🚴';
      default: return '🔔';
    }
  }

  timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "à l'instant";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `il y a ${days} j`;
    return new Date(iso).toLocaleDateString('fr-BE');
  }
}
