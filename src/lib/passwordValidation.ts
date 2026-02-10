export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push(`Legalább ${MIN_LENGTH} karakter hosszú legyen`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Tartalmazzon legalább egy nagybetűt');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Tartalmazzon legalább egy kisbetűt');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Tartalmazzon legalább egy számot');
  }

  return { isValid: errors.length === 0, errors };
}

export const PASSWORD_REQUIREMENTS = 'Legalább 8 karakter, nagybetű, kisbetű és szám.';
