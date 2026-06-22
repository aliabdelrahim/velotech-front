# =============================================================================
# Script de push partiel Velotech-front -> GitHub
# Scope : Authentification + Site public + Layout + Parcours achat
# Exclus : Dashboard, My-orders, Back-office (produits + orders)
# =============================================================================

# Aller dans le repo
Set-Location C:\Users\Abdelrahim\velotech-front

Write-Host "`n=== 1. Reset du commit local existant ===" -ForegroundColor Cyan
# Annule le commit MVP precedent mais garde les changements en stage
git reset --soft HEAD~1

Write-Host "`n=== 2. Unstage des modules non souhaites ===" -ForegroundColor Cyan
# Retire de la zone de staging les pages qu'on ne veut PAS pousser
git restore --staged `
    src/app/pages/dashboard `
    src/app/pages/my-orders `
    src/app/pages/products `
    src/app/pages/create-product `
    src/app/pages/edit-product `
    src/app/pages/store-products `
    src/app/pages/orders `
    src/app/services/store-product.ts `
    src/app/services/store-product.spec.ts 2>$null

Write-Host "`n=== 3. Re-stager app.routes.ts (version sans dashboard/my-orders) ===" -ForegroundColor Cyan
git add src/app/app.routes.ts

Write-Host "`n=== 4. Verification : nombre de fichiers staged ===" -ForegroundColor Cyan
$count = (git diff --cached --name-only | Measure-Object -Line).Lines
Write-Host "Fichiers staged : $count" -ForegroundColor Green

Write-Host "`n=== 5. Commit ===" -ForegroundColor Cyan
git commit -m "feat: initial Velotech frontend - public site + cart flow

Infrastructure
- environments/ : separation dev (localhost:7248) / prod (api.velotech.com)
- angular.json : fileReplacements pour environments
- styles.scss : palette charte, variables CSS, classes utilitaires

Authentification
- AuthService (login, logout, getRole, getStoreId, isLoggedIn)
- JwtInterceptor (Bearer token automatique)
- authGuard + guestGuard
- pages/login/ : formulaire complet avec gestion d'erreurs

Layout commun
- shared/header/ : logo + navigation + badge panier + bouton connexion
- shared/footer/ : 4 colonnes (brand, liens, legal, newsletter)

Zone publique
- pages/home/ : hero + features + velos phares + double CTA
- pages/catalog/ : filtres + tri + grille produits
- pages/product-detail/ : galerie + selecteur taille + onglets + CTA

Parcours achat
- CartService : signaux + persistance localStorage
- pages/cart/ : liste articles, modification quantites, recap
- pages/checkout/ : adresse + livraison + paiement + validation
- pages/order-confirmation/ : page de succes avec reference

Routes : 8 routes (/, /catalog/:storeId, /products/:id, /cart,
/checkout [auth], /order-confirmation/:id [auth], /login)"

Write-Host "`n=== 6. Configuration du remote ===" -ForegroundColor Cyan
git remote add origin https://github.com/aliabdelrahim/velotech-front.git 2>$null
git remote -v

Write-Host "`n=== 7. Renommage de la branche en main ===" -ForegroundColor Cyan
git branch -M main

Write-Host "`n=== 8. PUSH ! ===" -ForegroundColor Cyan
Write-Host "Une fenetre Git Credential Manager va peut-etre s'ouvrir pour t'authentifier sur GitHub." -ForegroundColor Yellow
git push -u origin main

Write-Host "`n=== TERMINE ! ===" -ForegroundColor Green
Write-Host "Verifie le resultat sur : https://github.com/aliabdelrahim/velotech-front" -ForegroundColor Green
