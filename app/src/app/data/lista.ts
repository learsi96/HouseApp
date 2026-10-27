// Reglas para armar y actualizar la lista del súper. Funciones puras (sin Firebase) para poder probarlas
// y reutilizarlas en el futuro backend.

import type { ArticuloLista, ComidaPlaneada } from './modelos';

/** articuloId → nombres de las comidas que lo usan. Los días especiales no aportan artículos. */
export type Derivados = Map<string, string[]>;

export function derivarArticulos(comidas: ComidaPlaneada[]): Derivados {
  const derivados: Derivados = new Map();
  for (const comida of comidas) {
    if (comida.tipo !== 'receta') {
      continue;
    }
    for (const id of comida.ingredientes) {
      const origenes = derivados.get(id) ?? [];
      if (!origenes.includes(comida.nombre)) {
        origenes.push(comida.nombre);
      }
      derivados.set(id, origenes);
    }
  }
  return derivados;
}

export function nuevaLista(derivados: Derivados): ArticuloLista[] {
  return [...derivados].map(([articuloId, origenes]) => ({
    articuloId,
    origenes,
    manual: false,
    quitado: false,
    comprado: false,
  }));
}

/**
 * Aplica los cambios de las comidas a una lista existente. Se conservan los palomeados,
 * los agregados a mano y los quitados. Un artículo que ya no usa ninguna comida sale de la lista,
 * salvo que se haya agregado a mano o ya esté en el carrito.
 */
export function actualizarLista(actual: ArticuloLista[], derivados: Derivados): ArticuloLista[] {
  const resultado: ArticuloLista[] = [];
  for (const articulo of actual) {
    const origenes = derivados.get(articulo.articuloId) ?? [];
    if (origenes.length || articulo.manual || articulo.comprado) {
      resultado.push({ ...articulo, origenes });
    }
  }
  const presentes = new Set(actual.map((a) => a.articuloId));
  for (const nuevo of nuevaLista(derivados)) {
    if (!presentes.has(nuevo.articuloId)) {
      resultado.push(nuevo);
    }
  }
  return resultado;
}

/** ¿Las comidas del rango ya no coinciden con lo que tiene la lista? */
export function hayCambios(actual: ArticuloLista[], derivados: Derivados): boolean {
  const enLista = actual.filter((a) => a.origenes.length);
  if (enLista.length !== derivados.size) {
    return true;
  }
  return enLista.some((a) => {
    const origenes = derivados.get(a.articuloId);
    return !origenes || origenes.length !== a.origenes.length || origenes.some((o) => !a.origenes.includes(o));
  });
}
