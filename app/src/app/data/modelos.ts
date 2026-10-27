// Modelos del dominio. Se mantienen planos (sin tipos de Firebase) para poder migrar a .NET + SQL.

export type ColorClasificacion =
  'verde' | 'rojo' | 'amarillo' | 'cafe' | 'naranja' | 'rosa' | 'azul' | 'turquesa' | 'morado' | 'gris';

export interface Clasificacion {
  id: string;
  nombre: string;
  icono: string;
  color: ColorClasificacion;
  orden: number;
  activo: boolean;
}

export interface Articulo {
  id: string;
  nombre: string;
  clasificacionId: string;
  basico: boolean;
  activo: boolean;
}
