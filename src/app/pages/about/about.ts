import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class AboutComponent {
  values = [
    { icon: '🌍', titleKey: 'ABOUT.VALUE1_TITLE', textKey: 'ABOUT.VALUE1_TEXT' },
    { icon: '🤝', titleKey: 'ABOUT.VALUE2_TITLE', textKey: 'ABOUT.VALUE2_TEXT' },
    { icon: '🔧', titleKey: 'ABOUT.VALUE3_TITLE', textKey: 'ABOUT.VALUE3_TEXT' },
    { icon: '💚', titleKey: 'ABOUT.VALUE4_TITLE', textKey: 'ABOUT.VALUE4_TEXT' },
  ];

  team = [
    { roleKey: 'ABOUT.TEAM_ROLE_CEO', name: 'Ali Abdelrahim', initials: 'AA' },
    { roleKey: 'ABOUT.TEAM_ROLE_TECH', name: 'Mehdi El Khattabi', initials: 'ME' },
    { roleKey: 'ABOUT.TEAM_ROLE_DESIGN', name: 'Sarah Bernard', initials: 'SB' },
    { roleKey: 'ABOUT.TEAM_ROLE_WORKSHOP', name: 'Lucas Martin', initials: 'LM' },
  ];

  milestones = [
    { year: '2023', eventKey: 'ABOUT.MILESTONE1' },
    { year: '2024', eventKey: 'ABOUT.MILESTONE2' },
    { year: '2025', eventKey: 'ABOUT.MILESTONE3' },
    { year: '2026', eventKey: 'ABOUT.MILESTONE4' },
  ];
}
