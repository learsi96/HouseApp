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

/** Plantilla de una comida. Los ingredientes son ids de artículos del catálogo (sin cantidades en el MVP). */
export interface Receta {
  id: string;
  nombre: string;
  ingredientes: string[];
  etiquetas: string[];
  activo: boolean;
}

/**
 * Comida asignada a un día. Guarda su propia copia del nombre y de los ingredientes,
 * así los ajustes del día no tocan la receta y los días pasados no cambian si la receta cambia.
 */
export interface ComidaPlaneada {
  id: string;
  /** 'YYYY-MM-DD' en hora local. */
  fecha: string;
  tipo: 'receta' | 'especial';
  /** Receta de origen (solo tipo 'receta'). */
  recetaId: string | null;
  nombre: string;
  /** Emoji de los días especiales. */
  icono: string;
  ingredientes: string[];
  /** Para ordenar las comidas de un mismo día en el orden en que se agregaron. */
  orden: number;
}

/** Artículo dentro de la lista del súper. */
export interface ArticuloLista {
  articuloId: string;
  /** Comidas del rango que lo usan (vacío si solo se agregó a mano). */
  origenes: string[];
  /** Agregado a mano (no depende de las comidas). */
  manual: boolean;
  /** Quitado de esta lista (ya lo tienen); la receta y la comida no cambian. */
  quitado: boolean;
  comprado: boolean;
}

/** La lista activa del hogar (solo hay una en el MVP). */
export interface ListaCompra {
  /** 'YYYY-MM-DD' */
  inicio: string;
  fin: string;
  articulos: ArticuloLista[];
}
