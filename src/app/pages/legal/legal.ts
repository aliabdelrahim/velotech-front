import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/header/header';
import { FooterComponent } from '../../shared/footer/footer';

type LegalKey = 'mentions' | 'cgv' | 'cgu' | 'rgpd' | 'cookies';

interface Section {
  title: string;
  paragraphs: string[];
}

interface LegalDoc {
  key: LegalKey;
  title: string;
  intro: string;
  lastUpdate: string;
  sections: Section[];
}

const DOCS: Record<LegalKey, LegalDoc> = {
  mentions: {
    key: 'mentions',
    title: 'Mentions legales',
    intro:
      "Conformement aux dispositions de la loi belge sur les services de la societe de l'information, nous informons les utilisateurs du site Velotech des elements suivants.",
    lastUpdate: 'Mise a jour : 16 juin 2026',
    sections: [
      {
        title: '1. Editeur du site',
        paragraphs: [
          "Velotech SRL, societe a responsabilite limitee de droit belge.",
          "Siege social : Rue de la Loi 16, 1000 Bruxelles, Belgique.",
          "Numero d'entreprise (BCE) : 0000.000.000",
          "TVA : BE 0000.000.000",
          "Representant legal : Ali Abdelrahim",
          "Contact : contact@velotech.com",
        ],
      },
      {
        title: '2. Hebergement',
        paragraphs: [
          "Le site est heberge par Microsoft Azure (Azure App Service - region West Europe).",
          "Microsoft Ireland Operations Limited, One Microsoft Place, South County Business Park, Leopardstown, Dublin 18, D18 P521, Ireland.",
        ],
      },
      {
        title: '3. Propriete intellectuelle',
        paragraphs: [
          "L'ensemble du contenu du site (textes, images, code source, logos, marques) est protege par le droit d'auteur et appartient a Velotech SRL ou a ses partenaires.",
          "Toute reproduction, representation, modification, publication ou adaptation de tout ou partie des elements du site, par quelque procede que ce soit, est interdite sans autorisation prealable ecrite.",
        ],
      },
      {
        title: '4. Responsabilite',
        paragraphs: [
          "Velotech s'efforce d'assurer l'exactitude et la mise a jour des informations diffusees sur ce site. Toutefois, Velotech ne peut garantir l'exactitude, la precision ou l'exhaustivite des informations mises a disposition.",
          "En consequence, Velotech decline toute responsabilite pour tout dommage resultant de l'utilisation des informations disponibles sur le site.",
        ],
      },
      {
        title: '5. Droit applicable',
        paragraphs: [
          "Tout litige relatif a l'utilisation du site Velotech est soumis au droit belge. Les tribunaux de l'arrondissement de Bruxelles sont seuls competents.",
        ],
      },
    ],
  },
  cgv: {
    key: 'cgv',
    title: 'Conditions Generales de Vente',
    intro:
      "Les presentes Conditions Generales de Vente (CGV) regissent les ventes de produits realisees via la plateforme Velotech entre les magasins partenaires et les clients particuliers.",
    lastUpdate: 'Mise a jour : 16 juin 2026',
    sections: [
      {
        title: '1. Objet',
        paragraphs: [
          "Les presentes CGV definissent les droits et obligations entre Velotech, les magasins partenaires (vendeurs) et les clients (acheteurs) lors de toute commande passee via la plateforme.",
          "Toute commande implique l'acceptation sans reserve des presentes CGV.",
        ],
      },
      {
        title: '2. Produits et prix',
        paragraphs: [
          "Les produits proposes a la vente sont decrits dans les fiches produits. Les photos et descriptions ont une valeur indicative.",
          "Les prix sont indiques en euros (EUR) toutes taxes comprises (TTC), TVA belge (21 %). Le prix peut varier d'un magasin a l'autre.",
          "Velotech se reserve le droit de modifier les prix a tout moment, mais les produits seront factures sur la base des tarifs en vigueur au moment de la validation de la commande.",
        ],
      },
      {
        title: '3. Commande et paiement',
        paragraphs: [
          "Le client valide sa commande apres avoir verifie le contenu de son panier et accepte les presentes CGV.",
          "Le paiement s'effectue en ligne par carte bancaire (Visa, Mastercard, Bancontact). Les donnees de paiement sont securisees par notre prestataire (Stripe / Mollie).",
          "La commande n'est consideree comme definitive qu'apres confirmation du paiement.",
        ],
      },
      {
        title: '4. Livraison et retrait',
        paragraphs: [
          "Deux options sont proposees : la livraison standard a domicile (3-5 jours ouvres, 9,90 EUR ; gratuite des 50 EUR) ou le retrait gratuit en magasin partenaire (24-48h).",
          "Les delais sont indicatifs ; tout retard ne peut donner lieu a une annulation ou a des dommages et interets.",
        ],
      },
      {
        title: '5. Droit de retractation',
        paragraphs: [
          "Conformement au droit europeen, le client dispose d'un delai de 14 jours pour exercer son droit de retractation a compter de la reception du produit, sans avoir a justifier de motif.",
          "Les frais de retour sont a la charge du client, sauf en cas de produit defectueux ou non conforme.",
        ],
      },
      {
        title: '6. Garanties',
        paragraphs: [
          "Tous les produits beneficient de la garantie legale de conformite (2 ans) et de la garantie contre les vices caches (Code civil belge).",
          "Certains produits beneficient d'une garantie commerciale supplementaire precisee dans la fiche produit.",
        ],
      },
    ],
  },
  cgu: {
    key: 'cgu',
    title: "Conditions Generales d'Utilisation",
    intro:
      "Les presentes Conditions Generales d'Utilisation (CGU) definissent les regles d'utilisation du site et des services Velotech.",
    lastUpdate: 'Mise a jour : 16 juin 2026',
    sections: [
      {
        title: '1. Acceptation des CGU',
        paragraphs: [
          "L'acces et l'utilisation de la plateforme Velotech impliquent l'acceptation sans reserve des presentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.",
        ],
      },
      {
        title: '2. Acces au service',
        paragraphs: [
          "L'acces a la plateforme est gratuit pour les utilisateurs disposant d'une connexion internet. Les frais associes a cette connexion restent a la charge de l'utilisateur.",
          "Certaines fonctionnalites (commande, location, RDV) necessitent la creation d'un compte utilisateur.",
        ],
      },
      {
        title: '3. Compte utilisateur',
        paragraphs: [
          "L'utilisateur s'engage a fournir des informations exactes et a les maintenir a jour.",
          "L'utilisateur est seul responsable de la confidentialite de son mot de passe et de toute utilisation de son compte.",
          "Velotech se reserve le droit de suspendre ou supprimer tout compte en cas de manquement aux CGU, de fraude ou d'utilisation abusive du service.",
        ],
      },
      {
        title: '4. Comportement des utilisateurs',
        paragraphs: [
          "L'utilisateur s'engage a utiliser le service de maniere loyale et conforme a la loi. Sont notamment interdits : la publication de contenu offensant, le harcelement, le spam, les tentatives d'intrusion sur les systemes.",
        ],
      },
      {
        title: '5. Disponibilite',
        paragraphs: [
          "Velotech s'efforce d'assurer une disponibilite maximale de la plateforme mais ne garantit pas un acces ininterrompu. Des maintenances peuvent etre programmees, generalement la nuit.",
        ],
      },
      {
        title: '6. Modification des CGU',
        paragraphs: [
          "Velotech se reserve le droit de modifier les presentes CGU a tout moment. Les utilisateurs seront informes de toute modification substantielle par email ou notification sur la plateforme.",
        ],
      },
    ],
  },
  rgpd: {
    key: 'rgpd',
    title: 'Politique de confidentialite (RGPD)',
    intro:
      "Velotech accorde une importance fondamentale a la protection des donnees personnelles de ses utilisateurs, conformement au Reglement General sur la Protection des Donnees (RGPD - UE 2016/679).",
    lastUpdate: 'Mise a jour : 16 juin 2026',
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          "Velotech SRL, Rue de la Loi 16, 1000 Bruxelles, est responsable du traitement des donnees collectees via la plateforme.",
          "Delegue a la Protection des Donnees (DPO) : dpo@velotech.com",
        ],
      },
      {
        title: '2. Donnees collectees',
        paragraphs: [
          "Lors de la creation d'un compte : nom, prenom, adresse email, mot de passe (hache, jamais en clair).",
          "Lors d'une commande : adresse de livraison, historique d'achat.",
          "Donnees de paiement : tokenisees via notre prestataire (Stripe / Mollie). Velotech n'a jamais acces a votre numero de carte complet.",
          "Donnees techniques : adresse IP, type de navigateur, logs de connexion (conserves 12 mois pour des raisons de securite).",
        ],
      },
      {
        title: '3. Finalites du traitement',
        paragraphs: [
          "Execution des commandes et locations (base contractuelle).",
          "Gestion du compte client (base contractuelle).",
          "Communications marketing : uniquement avec votre consentement explicite, revocable a tout moment.",
          "Securite de la plateforme et lutte contre la fraude (interet legitime).",
        ],
      },
      {
        title: '4. Vos droits',
        paragraphs: [
          "Acces : obtenir une copie de vos donnees personnelles.",
          "Rectification : corriger des donnees inexactes.",
          "Effacement (droit a l'oubli) : supprimer vos donnees, dans le respect des delais legaux.",
          "Limitation et opposition : demander l'arret de certains traitements.",
          "Portabilite : recuperer vos donnees dans un format lisible par machine (JSON).",
          "Vous pouvez exercer ces droits depuis votre espace personnel (/profile) ou par email a dpo@velotech.com.",
        ],
      },
      {
        title: '5. Duree de conservation',
        paragraphs: [
          "Identite et compte : 3 ans apres la derniere activite.",
          "Historique de commandes et factures : 10 ans (obligation comptable).",
          "Logs techniques : 12 mois.",
          "Cookies analytiques : 13 mois maximum.",
        ],
      },
      {
        title: '6. Securite',
        paragraphs: [
          "Vos donnees sont stockees sur des serveurs situes en Union Europeenne (Microsoft Azure - region West Europe).",
          "Mots de passe haches avec PBKDF2 (100 000 iterations, sel unique).",
          "Toutes les communications sont chiffrees via TLS 1.3.",
          "Sauvegardes quotidiennes chiffrees.",
        ],
      },
      {
        title: '7. Reclamation',
        paragraphs: [
          "Vous disposez du droit d'introduire une reclamation aupres de l'Autorite de Protection des Donnees belge :",
          "Rue de la Presse 35, 1000 Bruxelles. www.autoriteprotectiondonnees.be",
        ],
      },
    ],
  },
  cookies: {
    key: 'cookies',
    title: 'Politique de cookies',
    intro:
      "Le site Velotech utilise des cookies et technologies similaires pour ameliorer votre experience et analyser l'utilisation du service.",
    lastUpdate: 'Mise a jour : 16 juin 2026',
    sections: [
      {
        title: '1. Cookies essentiels',
        paragraphs: [
          "Ces cookies sont indispensables au fonctionnement du site : authentification, panier, preferences de langue.",
          "Ils ne necessitent pas votre consentement.",
        ],
      },
      {
        title: '2. Cookies analytiques',
        paragraphs: [
          "Nous utilisons Plausible ou Matomo (hebergement EU, sans cookies tiers) pour analyser de maniere agregee l'utilisation du site.",
          "Aucune donnee personnelle identifiable n'est collectee.",
        ],
      },
      {
        title: '3. Gestion des cookies',
        paragraphs: [
          "Vous pouvez a tout moment desactiver les cookies dans les parametres de votre navigateur.",
          "La desactivation des cookies essentiels peut empecher l'utilisation du site.",
        ],
      },
    ],
  },
};

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './legal.html',
  styleUrl: './legal.scss',
})
export class LegalComponent implements OnInit {
  private route = inject(ActivatedRoute);

  doc = signal<LegalDoc>(DOCS.mentions);

  nav: Array<{ key: LegalKey; label: string; path: string }> = [
    { key: 'mentions', label: 'Mentions legales', path: '/legal' },
    { key: 'cgv', label: 'CGV', path: '/legal/cgv' },
    { key: 'cgu', label: 'CGU', path: '/legal/cgu' },
    { key: 'rgpd', label: 'RGPD', path: '/legal/rgpd' },
    { key: 'cookies', label: 'Cookies', path: '/legal/cookies' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const key = (params.get('section') ?? 'mentions') as LegalKey;
      this.doc.set(DOCS[key] ?? DOCS.mentions);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    });
  }
}
