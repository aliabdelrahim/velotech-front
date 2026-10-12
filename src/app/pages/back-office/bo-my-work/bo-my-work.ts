import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth';
import {
  RepairService,
  RepairDetailsDto,
  CreateRepairDto,
  CompleteRepairDto,
} from '../../../services/repair';
import {
  AppointmentService,
  AppointmentDetailsDto,
} from '../../../services/appointment';
import { ProductService, ProductDetailsDto } from '../../../services/product';
import { forkJoin } from 'rxjs';

/**
 * Dashboard du Technicien :
 *  1. "RDV a traiter" : les RDV reparation du magasin pas encore pris en charge
 *     -> le tech clique "Prendre en charge" -> cree une Repair, se s'assigne
 *  2. "Mes reparations en cours" : status Open ou InProgress
 *     -> actions Start / Complete (avec modal pour cout + travail effectue)
 *  3. "Historique" : reparations terminees ou annulees
 */
@Component({
  selector: 'app-bo-my-work',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './bo-my-work.html',
  styleUrls: ['../bo-orders/bo-orders.scss', './bo-my-work.scss'],
})
export class BoMyWorkComponent implements OnInit {
  private repairService = inject(RepairService);
  private appointmentService = inject(AppointmentService);
  private productService = inject(ProductService);
  private auth = inject(AuthService);

  appointmentsToProcess = signal<AppointmentDetailsDto[]>([]);
  myRepairs = signal<RepairDetailsDto[]>([]);
  /** Liste des velos (produits de type Bike) pour la selection dans la modal. */
  availableBikes = signal<ProductDetailsDto[]>([]);
  loading = signal(true);
  errorMsg = signal<string | null>(null);

  // Tri des reparations en 3 buckets
  activeRepairs = computed(() =>
    this.myRepairs()
      .filter((r) => r.status === 'Open' || r.status === 'InProgress')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );

  completedRepairs = computed(() =>
    this.myRepairs()
      .filter((r) => r.status === 'Done' || r.status === 'Completed' || r.status === 'Cancelled')
      .sort((a, b) =>
        new Date(b.completedAt || b.createdAt).getTime() -
        new Date(a.completedAt || a.createdAt).getTime()
      )
  );

  // --- Modal "Prendre en charge un RDV" ---
  showTakeModal = signal(false);
  takeAppointment = signal<AppointmentDetailsDto | null>(null);
  takeDiagnosis = signal('');
  /** Vélo selectionne par le tech (depuis la liste des produits de type Bike). */
  takeProductId = signal<number | null>(null);
  takeSubmitting = signal(false);
  takeError = signal<string | null>(null);

  // --- Modal "Cloturer une reparation" ---
  showCompleteModal = signal(false);
  completeRepair = signal<RepairDetailsDto | null>(null);
  completeWorkDone = signal('');
  completeCost = signal<number>(0);
  completeSubmitting = signal(false);
  completeError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.errorMsg.set(null);
    forkJoin({
      appts: this.appointmentService.getToProcess(),
      repairs: this.repairService.getMine(),
      products: this.productService.getProducts(),
    }).subscribe({
      next: ({ appts, repairs, products }) => {
        this.appointmentsToProcess.set(appts);
        this.myRepairs.set(repairs);
        // On garde uniquement les velos (type Bike), car seuls les velos sont reparables
        this.availableBikes.set(products.filter((p) => p.type === 'Bike'));
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Impossible de charger votre atelier.');
        this.loading.set(false);
      },
    });
  }

  // ========== Prise en charge d'un RDV ==========

  openTakeModal(a: AppointmentDetailsDto): void {
    this.takeAppointment.set(a);
    this.takeDiagnosis.set('');
    // Si le RDV a deja un velo associe, on le preselectionne.
    // Sinon le tech devra en choisir un dans la liste.
    this.takeProductId.set(a.productId ?? null);
    this.takeError.set(null);
    this.showTakeModal.set(true);
  }

  closeTakeModal(): void {
    if (this.takeSubmitting()) return;
    this.showTakeModal.set(false);
    this.takeAppointment.set(null);
  }

  confirmTake(): void {
    const appt = this.takeAppointment();
    if (!appt) return;

    // On utilise le velo selectionne par le tech (soit celui du RDV, soit celui choisi)
    const productId = this.takeProductId();
    if (!productId) {
      this.takeError.set("Veuillez selectionner le velo a reparer.");
      return;
    }

    const techId = Number(this.auth.getUserId());
    if (!techId) {
      this.takeError.set("Identifiant utilisateur introuvable.");
      return;
    }

    this.takeSubmitting.set(true);
    const dto: CreateRepairDto = {
      storeId: appt.storeId,
      productId: productId,
      technicianId: techId,
      appointmentId: appt.appointmentId,
      diagnosis: this.takeDiagnosis().trim() || null,
    };

    this.repairService.create(dto).subscribe({
      next: () => {
        this.takeSubmitting.set(false);
        this.showTakeModal.set(false);
        this.takeAppointment.set(null);
        this.loadAll();
      },
      error: (err) => {
        this.takeSubmitting.set(false);
        this.takeError.set(this.extractError(err));
      },
    });
  }

  // ========== Demarrer une reparation ==========
  //
  // Workflow simplifie : la reparation est demarree AUTOMATIQUEMENT a la prise
  // en charge (via AutoStart=true dans CreateRepairDto). Plus de bouton "Demarrer"
  // dans l'UI du tech. L'endpoint reste disponible pour un usage futur
  // (file d'attente, planification differee...).
  startRepair(r: RepairDetailsDto): void {
    this.repairService.start(r.repairId).subscribe({
      next: () => this.loadAll(),
      error: (err) => alert(this.extractError(err)),
    });
  }

  // ========== Cloturer une reparation ==========

  openCompleteModal(r: RepairDetailsDto): void {
    this.completeRepair.set(r);
    this.completeWorkDone.set(r.workDone ?? '');
    this.completeCost.set(r.cost ?? 0);
    this.completeError.set(null);
    this.showCompleteModal.set(true);
  }

  closeCompleteModal(): void {
    if (this.completeSubmitting()) return;
    this.showCompleteModal.set(false);
    this.completeRepair.set(null);
  }

  confirmComplete(): void {
    const r = this.completeRepair();
    if (!r) return;
    const work = this.completeWorkDone().trim();
    const cost = this.completeCost();

    if (!work) {
      this.completeError.set('Decrivez le travail effectue.');
      return;
    }
    if (cost < 0 || isNaN(cost)) {
      this.completeError.set('Cout invalide.');
      return;
    }

    this.completeSubmitting.set(true);
    const dto: CompleteRepairDto = { workDone: work, cost };

    this.repairService.complete(r.repairId, dto).subscribe({
      next: () => {
        this.completeSubmitting.set(false);
        this.showCompleteModal.set(false);
        this.completeRepair.set(null);
        this.loadAll();
      },
      error: (err) => {
        this.completeSubmitting.set(false);
        this.completeError.set(this.extractError(err));
      },
    });
  }

  // ========== Helpers ==========

  statusClass(status: string): string {
    switch (status) {
      case 'Done':
      case 'Completed': return 'badge-success';
      case 'InProgress': return 'badge-info';
      case 'Cancelled': return 'badge-warning';
      case 'Open': return 'badge-pending';
      default: return 'badge-info';
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Open': return 'À démarrer';
      case 'InProgress': return 'En cours';
      case 'Done':
      case 'Completed': return 'Terminée';
      case 'Cancelled': return 'Annulée';
      default: return status;
    }
  }

  private extractError(err: any): string {
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return 'Une erreur est survenue.';
  }
}
