// Normaliza un DNI para comparaciones tolerantes a ceros a la izquierda:
// solo dígitos, recortado, y rellenado a 8 posiciones con ceros iniciales.
export function normalizeDni(value) {
  const digits = String(value ?? '').replace(/\D/g, '').trim();
  if (!digits) return '';
  if (digits.length > 8) return digits;
  return digits.padStart(8, '0');
}