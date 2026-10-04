import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageService } from '../../services/language.service';

/**
 * Sélecteur de langue : FR / NL.
 * S'utilise dans le header : <app-language-switcher />
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="lang-switcher" role="group" [attr.aria-label]="'LANG.SWITCH' | translate">
      <button type="button"
              (click)="set('fr')"
              [class.active]="current() === 'fr'"
              [attr.aria-pressed]="current() === 'fr'">
        FR
      </button>
      <span class="sep">|</span>
      <button type="button"
              (click)="set('nl')"
              [class.active]="current() === 'nl'"
              [attr.aria-pressed]="current() === 'nl'">
        NL
      </button>
    </div>
  `,
  styles: [`
    .lang-switcher {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .lang-switcher button {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.15rem 0.4rem;
      color: inherit;
      opacity: 0.6;
      border-radius: 3px;
      transition: opacity 0.15s, background-color 0.15s;
    }
    .lang-switcher button:hover { opacity: 1; }
    .lang-switcher button.active {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.08);
    }
    .sep { opacity: 0.4; }
  `],
})
export class LanguageSwitcherComponent {
  private langService = inject(LanguageService);

  current(): string {
    return this.langService.current();
  }

  set(lang: 'fr' | 'nl'): void {
    this.langService.use(lang);
  }
}
