import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactComponent {
  subjects = [
    'Question generale',
    'Devenir magasin partenaire',
    'Probleme avec une commande',
    'Probleme technique sur le site',
    'Demande presse / RP',
    'Autre',
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
    if (!m.name.trim()) e.name = 'Votre nom est requis';
    if (!m.email.trim()) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim()))
      e.email = "Format d'email invalide";
    if (!m.subject) e.subject = 'Choisissez un sujet';
    if (!m.message.trim() || m.message.trim().length < 10)
      e.message = 'Decrivez votre demande (10 caracteres minimum)';
    if (!m.acceptedTerms) e.terms = 'Vous devez accepter le traitement de vos donnees';
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
