import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Service centralisant la gestion de la langue de l'interface.
 * Persiste le choix de l'utilisateur dans localStorage.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translate = inject(TranslateService);
  readonly supported = ['fr', 'nl'] as const;
  readonly defaultLang: 'fr' | 'nl' = 'fr';

  private readonly STORAGE_KEY = 'velotech_lang';

  /** Initialise la langue au demarrage de l'application. */
  init(): void {
    this.translate.addLangs([...this.supported]);
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const initial: 'fr' | 'nl' = (saved && (this.supported as readonly string[]).includes(saved))
      ? (saved as 'fr' | 'nl')
      : (navigator.language?.startsWith('nl') ? 'nl' : 'fr');
    this.translate.use(initial);
  }

  /** Retourne la langue actuelle. */
  current(): string {
    return this.translate.currentLang || this.defaultLang;
  }

  /** Change la langue et persiste le choix. */
  use(lang: 'fr' | 'nl'): void {
    if (!(this.supported as readonly string[]).includes(lang)) return;
    this.translate.use(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
  }
}
