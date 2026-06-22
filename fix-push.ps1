# =============================================================================
# Correctif : retire dashboard et my-orders du repo distant
# =============================================================================

Set-Location C:\Users\Abdelrahim\velotech-front

Write-Host "`n=== 1. Suppression des dossiers du tracking git ===" -ForegroundColor Cyan
git rm -r --cached src/app/pages/dashboard
git rm -r --cached src/app/pages/my-orders

Write-Host "`n=== 2. Re-stage de app.routes.ts (deja sans les routes dashboard/my-orders) ===" -ForegroundColor Cyan
# Le fichier local a deja la bonne version
git add src/app/app.routes.ts

Write-Host "`n=== 3. Verification des changes ===" -ForegroundColor Cyan
$count = (git diff --cached --name-only | Measure-Object -Line).Lines
Write-Host "Fichiers a commit : $count" -ForegroundColor Green

Write-Host "`n=== 4. Commit du retrait ===" -ForegroundColor Cyan
git commit -m "chore: retire dashboard et my-orders du scope public

Ces deux modules font partie de l'espace client connecte et seront
pousses dans un commit ulterieur quand ils seront finalises."

Write-Host "`n=== 5. Push ===" -ForegroundColor Cyan
git push

Write-Host "`n=== TERMINE ! ===" -ForegroundColor Green
Write-Host "Verifie : https://github.com/aliabdelrahim/velotech-front/tree/main/src/app/pages" -ForegroundColor Green
Write-Host "Les dossiers 'dashboard' et 'my-orders' ne doivent plus apparaitre." -ForegroundColor Green
