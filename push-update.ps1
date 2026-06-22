# =============================================================================
# Push final : nouvelles fonctionnalites front
# =============================================================================

Set-Location C:\Users\Abdelrahim\velotech-front

Write-Host "`n=== 1. Etat git actuel ===" -ForegroundColor Cyan
git status -s | Select-Object -First 30

Write-Host "`n=== 2. Stage de tous les changements ===" -ForegroundColor Cyan
git add .

$count = (git diff --cached --name-only | Measure-Object -Line).Lines
Write-Host "`n=== 3. Fichiers a commit : $count ===" -ForegroundColor Green

Write-Host "`n=== 4. Commit ===" -ForegroundColor Cyan
git commit -m "feat: ajout register, profile, my-rentals, my-appointments, reservations, stores, pages publiques, back-office, admin et tests

Authentification
- Page /register avec validation + indicateur de force de mot de passe
- Page /forgot-password + /reset-password/:token
- Login modernise avec lien vers /register et /forgot-password

Espace client
- Page /profile (edition profil + changement mot de passe)
- Page /my-rentals avec tabs et annulation
- Page /my-appointments avec tabs et annulation
- Page /rentals/new (formulaire de reservation location)
- Page /appointments/new (prise de RDV avec creneaux)

Zone publique
- Page /stores avec carte Leaflet interactive (geocoding par CP belge)
- Page /about avec timeline et equipe
- Page /contact avec formulaire complet
- Pages legales : /legal, /legal/cgv, /legal/cgu, /legal/rgpd, /legal/cookies

Back-office (Manager / Tech / Admin)
- Layout BO avec sidebar (sections par role)
- Dashboard BO avec KPIs (CA, commandes, locations, RDV)
- Pages : commandes, locations, RDV, reparations, produits, stocks
- Gestion temps reel des stocks avec alertes seuil bas

Administration (Admin uniquement)
- Page magasins avec creation
- Page utilisateurs avec filtre par role
- Page roles et permissions

Tests Vitest
- AuthService (8 tests : login, register, logout, forgot, reset)
- CartService (14 tests : add, remove, totaux, livraison gratuite)
- authGuard et guestGuard

Corrections
- Fiche produit : selecteur de taille conditionnel par type
  (Velo, Casque, Equipement uniquement)
- Header : icone profil quand utilisateur connecte
- Index.html : Google Fonts + Leaflet + meta SEO"

Write-Host "`n=== 5. PUSH ===" -ForegroundColor Cyan
git push

Write-Host "`n=== TERMINE ===" -ForegroundColor Green
Write-Host "Verifie sur : https://github.com/aliabdelrahim/velotech-front" -ForegroundColor Green
