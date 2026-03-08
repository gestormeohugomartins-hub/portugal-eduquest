export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula");
  if (!/[a-z]/.test(password)) errors.push("Pelo menos 1 letra minúscula");
  if (!/[0-9]/.test(password)) errors.push("Pelo menos 1 dígito");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push("Pelo menos 1 carácter especial (!@#$%...)");

  return { isValid: errors.length === 0, errors };
};

export const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
  if (!password) return { level: 0, label: "", color: "" };
  const { errors } = validatePassword(password);
  const score = 5 - errors.length;
  if (score <= 1) return { level: 20, label: "Muito fraca", color: "bg-destructive" };
  if (score === 2) return { level: 40, label: "Fraca", color: "bg-destructive" };
  if (score === 3) return { level: 60, label: "Razoável", color: "bg-yellow-500" };
  if (score === 4) return { level: 80, label: "Forte", color: "bg-green-400" };
  return { level: 100, label: "Muito forte", color: "bg-green-600" };
};
