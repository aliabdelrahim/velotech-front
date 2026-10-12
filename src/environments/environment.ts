/**
 * Environnement par defaut (production).
 * Remplace via fileReplacements en mode dev (cf. angular.json).
 *
 * apiUrl : URL de l'API deployee sur Azure App Service.
 * A adapter avec le nom exact de ton App Service (cf. DEPLOIEMENT.md).
 */
export const environment = {
  production: true,
  apiUrl: 'https://velotech-api.azurewebsites.net/api',
};
