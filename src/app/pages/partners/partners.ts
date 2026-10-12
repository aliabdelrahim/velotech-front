import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

/**
 * Landing page "Partenaires" : page commerciale B2B destinee aux magasins
 * de velo belges qui veulent adherer a la plateforme Velotech.
 *
 * Structure : Hero -> Problemes -> Solution -> Features -> Chiffres cles
 *          -> Tarifs -> Temoignages -> FAQ -> Formulaire de contact.
 */
@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './partners.html',
  styleUrl: './partners.scss',
})
export class PartnersComponent {
  private i18n = inject(TranslateService);

  // -------- FAQ accordeon --------
  openedFaq = signal<number | null>(0);

  toggleFaq(index: number): void {
    this.openedFaq.set(this.openedFaq() === index ? null : index);
  }

  // -------- Formulaire de contact --------
  form = signal({
    shopName: '',
    contactName: '',
    email: '',
    phone: '',
    shopSize: 'small',
    message: '',
  });

  errors = signal<Record<string, string>>({});
  submitting = signal(false);
  success = signal(false);

  set<K extends keyof ReturnType<typeof this.form>>(key: K, value: any): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  private validate(): Record<string, string> {
    const f = this.form();
    const e: Record<string, string> = {};
    if (!f.shopName.trim()) e['shopName'] = this.i18n.instant('PARTNERS.ERR_SHOP');
    if (!f.contactName.trim()) e['contactName'] = this.i18n.instant('PARTNERS.ERR_NAME');
    if (!f.email.trim()) {
      e['email'] = this.i18n.instant('PARTNERS.ERR_EMAIL_REQ');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      e['email'] = this.i18n.instant('PARTNERS.ERR_EMAIL_FMT');
    }
    return e;
  }

  onSubmit(): void {
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    this.submitting.set(true);
    // En prod on appellerait un endpoint type POST /api/leads qui envoie un
    // email au commercial Velotech. En dev on simule juste un succes apres 800ms.
    setTimeout(() => {
      this.submitting.set(false);
      this.success.set(true);
      this.form.set({
        shopName: '',
        contactName: '',
        email: '',
        phone: '',
        shopSize: 'small',
        message: '',
      });
    }, 800);
  }

  scrollToForm(): void {
    document.getElementById('contact-form')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  scrollToPricing(): void {
    document.getElementById('pricing')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
