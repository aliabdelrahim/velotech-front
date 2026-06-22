import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RoleInfo {
  name: string;
  color: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-roles.html',
  styleUrl: '../../back-office/bo-orders/bo-orders.scss',
})
export class AdminRolesComponent {
  roles: RoleInfo[] = [
    {
      name: 'Client',
      color: '#1976D2',
      description:
        "Utilisateur final : achete, loue et prend rendez-vous a l'atelier.",
      permissions: [
        'Consulter le catalogue public',
        'Passer commande, payer en ligne',
        'Reserver une location',
        'Prendre rendez-vous a l\'atelier',
        'Consulter son profil et son historique',
      ],
    },
    {
      name: 'Tech',
      color: '#1A2332',
      description:
        "Technicien d'atelier : gere les reparations et rendez-vous de son magasin.",
      permissions: [
        'Tous les droits Client',
        'Voir les rendez-vous du magasin',
        'Demarrer et cloturer une reparation',
        'Marquer une location comme rendue',
      ],
    },
    {
      name: 'Manager',
      color: '#2E7D32',
      description:
        "Gerant de magasin : pilote le commerce et les operations quotidiennes.",
      permissions: [
        'Tous les droits Tech',
        'Voir et modifier les produits du catalogue',
        'Gerer les stocks (vente et location) du magasin',
        'Voir toutes les commandes / locations / RDV du magasin',
        'Annuler une commande, une location, un RDV',
      ],
    },
    {
      name: 'Admin',
      color: '#FF7043',
      description:
        "Administrateur du reseau Velotech : pilote la plateforme et les comptes.",
      permissions: [
        'Tous les droits Manager (multi-magasins)',
        'Creer, modifier ou supprimer un magasin',
        'Creer ou desactiver un utilisateur',
        'Affecter un utilisateur a un magasin',
        'Acces aux statistiques globales (tous magasins)',
      ],
    },
  ];
}
