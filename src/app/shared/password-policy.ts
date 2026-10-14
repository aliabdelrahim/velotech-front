/**
 * Regle de robustesse des mots de passe, identique a celle de l'API
 * (Velotech.API/Security/PasswordPolicy.cs) : 8 caracteres minimum,
 * au moins une lettre et au moins un chiffre.
 */
export const PASSWORD_MIN_LENGTH = 8;

export function isStrongPassword(password: string | null | undefined): boolean {
  return (
    !!password &&
    password.length >= PASSWORD_MIN_LENGTH &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}
