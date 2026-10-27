// Fechas como texto 'YYYY-MM-DD' en hora local: se comparan y ordenan como texto y no sufren cambios de zona horaria.

export function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function deIso(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

export function hoyIso(): string {
  return aIso(new Date());
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

/** Lunes de la semana de la fecha. */
export function inicioSemana(fecha: Date): Date {
  return sumarDias(fecha, -((fecha.getDay() + 6) % 7));
}

export function inicioMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

const formato = (opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
  new Intl.DateTimeFormat('es-MX', opciones);

const diaSemana = formato({ weekday: 'long' });
const diaMes = formato({ day: 'numeric', month: 'short' });
const diaCompleto = formato({ weekday: 'long', day: 'numeric', month: 'long' });
const mesAnio = formato({ month: 'long', year: 'numeric' });

const capital = (texto: string): string => texto.charAt(0).toUpperCase() + texto.slice(1);

/** "Lunes" */
export const nombreDia = (fecha: Date): string => capital(diaSemana.format(fecha));
/** "27 oct" */
export const fechaCorta = (fecha: Date): string => diaMes.format(fecha).replace('.', '');
/** "Lunes 27 de octubre" */
export const fechaLarga = (fecha: Date): string => capital(diaCompleto.format(fecha).replace(',', ''));
/** "Octubre de 2026" */
export const nombreMes = (fecha: Date): string => capital(mesAnio.format(fecha));
