export type TipoNodo = 'modulo' | 'pantalla' | 'componente' | 'texto';
export type EstadoVerificacion = 'pendiente' | 'en_revision' | 'verificado';
export type TipoConexion = 'navegacion' | 'jerarquia';
export type TipoContenido = 'texto' | 'imagen' | 'otro';
export type PrioridadContenido = 'alta' | 'media' | 'baja';
export type OrigenChecklist = 'manual' | 'ia';
export type EstadoChecklist = 'pendiente' | 'aceptado' | 'descartado';

export interface ContenidoItem {
  id?: number;
  proyecto_id?: number;
  nodo_id?: number | null;
  tipo: TipoContenido;
  nombre: string;
  detalle?: string;
  prioridad?: PrioridadContenido;
  archivo_id?: number | null;
  orden?: number;
}

export interface NodoPantalla {
  id?: number;
  proyecto_id?: number;
  nombre: string;
  tipo?: TipoNodo;
  icono?: string;
  descripcion?: string;
  pos_x?: number;
  pos_y?: number;
  prioridad?: 'alta' | 'media' | 'baja' | null;
  estado_verificacion?: 'pendiente' | 'en_progreso' | 'completado' | 'revisado';
  enlace_diseno_externo?: string;
  creado_en?: string;
  actualizado_en?: string;
  contenidos?: ContenidoItem[];
  _drag_x?: number;
  _drag_y?: number;
}

export interface NodoConexion {
  id?: number;
  proyecto_id?: number;
  nodo_origen_id: number;
  nodo_destino_id: number;
  tipo_conexion?: TipoConexion;
}

export interface DisenoConceptualChecklistItem {
  id?: number;
  proyecto_id?: number;
  pregunta: string;
  origen?: OrigenChecklist;
  estado?: EstadoChecklist;
  creado_en?: string;
}

export interface WireframeChecklistItem {
  id?: number;
  wireframe_id?: number;
  pregunta: string;
  origen?: OrigenChecklist;
  estado?: EstadoChecklist;
  creado_en?: string;
}

export interface Wireframe {
  id?: number;
  proyecto_id?: number;
  nodo_id?: number | null;
  archivo_id: number;
  version?: string;
  generado_por_ia?: boolean;
  creado_en?: string;
  checklist_items?: WireframeChecklistItem[];
}
