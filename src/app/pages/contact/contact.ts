import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

interface ContactModel {
  name: string;
  email: string;
  subject: string;
  message: string;
  acceptedTerms: boolean;
}

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  terms?: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, HeaderComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactComponent {
  private i18n = inject(TranslateService);

  subjectKeys = [
    'CONTACT.SUBJECT_GENERAL',
    'CONTACT.SUBJECT_PARTNER',
    'CONTACT.SUBJECT_ORDER',
    'CONTACT.SUBJECT_TECH',
    'CONTACT.SUBJECT_PRESS',
    'CONTACT.SUBJECT_OTHER',
  ];

  model = signal<ContactModel>({
    name: '',
    email: '',
    subject: '',
    message: '',
    acceptedTerms: false,
  });

  errors = signal<FieldErrors>({});
  submitting = signal(false);
  success = signal(false);

  set<K extends keyof ContactModel>(key: K, value: ContactModel[K]): void {
    this.model.update((m) => ({ ...m, [key]: value }));
  }

  private validate(): FieldErrors {
    const m = this.model();
    const e: FieldErrors = {};
    if (!m.name.trim()) e.name = this.i18n.instant('CONTACT.ERR_NAME');
    if (!m.email.trim()) e.email = this.i18n.instant('CONTACT.ERR_EMAIL');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim()))
      e.email = this.i18n.instant('CONTACT.ERR_EMAIL_FORMAT');
    if (!m.subject) e.subject = this.i18n.instant('CONTACT.ERR_SUBJECT');
    if (!m.message.trim() || m.message.trim().length < 10)
      e.message = this.i18n.instant('CONTACT.ERR_MESSAGE');
    if (!m.acceptedTerms) e.terms = this.i18n.instant('CONTACT.ERR_TERMS');
    return e;
  }

  onSubmit(form: NgForm): void {
    const e = this.validate();
    this.errors.set(e);
    if (Object.keys(e).length > 0) return;

    this.submitting.set(true);
    // NOTE: endpoint /contact a ajouter cote back ; pour l'instant simulation.
    setTimeout(() => {
      this.success.set(true);
      this.submitting.set(false);
      // Reset form
      this.model.set({
        name: '',
        email: '',
        subject: '',
        message: '',
        acceptedTerms: false,
      });
    }, 800);
  }
}
