// Marcas de acento que quedan separadas de la letra después de normalize('NFD').
const ACENTOS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Clave para comparar nombres: sin acentos, sin mayúsculas y sin espacios de sobra. */
export function claveTexto(texto: string): string {
  return texto.normalize('NFD').replace(ACENTOS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Limpia lo que escribe el usuario y pone la primera letra en mayúscula. */
export function limpiarNombre(texto: string): string {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
