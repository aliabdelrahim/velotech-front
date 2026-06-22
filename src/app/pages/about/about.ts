import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent {
  values = [
    {
      icon: '🌍',
      title: 'Écologie',
      text: 'Promouvoir le vélo comme alternative de mobilité durable et accessible.',
    },
    {
      icon: '🤝',
      title: 'Proximité',
      text: 'Réseau de magasins indépendants, conseils humains, atelier de quartier.',
    },
    {
      icon: '🔧',
      title: 'Expertise',
      text: 'Techniciens certifiés, pièces d\'origine, service après-vente garanti.',
    },
    {
      icon: '💚',
      title: 'Transparence',
      text: 'Prix clairs, données privées protégées, plateforme open source.',
    },
  ];

  team = [
    { role: 'Fondateur & CEO', name: 'Ali Abdelrahim', initials: 'AA' },
    { role: 'Lead Tech', name: 'Mehdi El Khattabi', initials: 'ME' },
    { role: 'Designer', name: 'Sarah Bernard', initials: 'SB' },
    { role: 'Responsable Atelier', name: 'Lucas Martin', initials: 'LM' },
  ];

  milestones = [
    { year: '2023', event: 'Idée du projet pendant un stage en magasin de vélo.' },
    { year: '2024', event: 'Premier prototype, premier magasin partenaire à Bruxelles.' },
    { year: '2025', event: 'Lancement officiel, 5 magasins en Belgique.' },
    { year: '2026', event: 'Objectif : 20 magasins, lancement de l\'application mobile.' },
  ];
}
