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
  base64Data?: string;
  fileName?: string;
  archivo_url?: string;
}


// ============================================================================
// MODELOS DE REESTRUCTURACION ESTETICA AUTOMATIZADA (Bessghaier et al., 2022)
// ============================================================================

export interface BoundingBoxElemento {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cuadrante?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export interface DefectoEstructural {
  code: 'IM' | 'ICM' | 'ILW' | 'OM' | 'DN';
  nombre: string;
  descripcion: string;
  severidad: 'alta' | 'media' | 'baja';
  categoria: 'Layout' | 'Visual';
}

export interface CuadranteInfo {
  codigo: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  nombre: string;
  elementos_count: number;
  porcentaje: number;
  estado: 'saturado' | 'desbalanceado' | 'equilibrado';
  elementos: BoundingBoxElemento[];
}

export interface RecomendacionMaterial {
  id: string;
  guideline: string;
  titulo: string;
  descripcion: string;
  tipo: 'automatica' | 'manual' | 'sugerencia';
  icono: string;
  beneficio: string;
}

export interface RestructuringResult {
  frame: { width: number; height: number };
  total_elementos: number;
  score_estructural: {
    original: number;
    reestructurado: number;
    mejora_porcentaje: number;
    interpretacion: string;
  };
  defectos_detectados: DefectoEstructural[];
  cuadrantes: CuadranteInfo[];
  color_analisis?: {
    top_colors: Array<{ color: string; porcentaje: number }>;
    cumple_60_30_10: boolean;
    vibrating_detected: boolean;
    vibrating_detail: string;
  };
  original_boxes: BoundingBoxElemento[];
  restructured_boxes: BoundingBoxElemento[];
  recomendaciones: RecomendacionMaterial[];
  css_export?: string;
}

// ============================================================================
// MODELOS DE EVALUACIÓN MULTICRITERIO DE LAYOUT (REGRESIÓN & ENTROPÍA)
// ============================================================================

export interface MulticriteriaMetricaItem {
  codigo: 'DE' | 'VS' | 'BA' | 'PR' | 'UN' | 'SI' | 'SE';
  nombre: string;
  formula: string;
  valor: number;
  porcentaje: number;
  estado: 'óptimo' | 'aceptable' | 'mejorable';
  color: 'success' | 'warning' | 'danger';
  peso_entropia: number;
  peso_regresion: number;
  nivel_relevancia?: string;
  descripcion: string;
}

export interface MulticriteriaRadarPoint {
  eje: string;
  label: string;
  valor: number;
  porcentaje: number;
}

export interface MulticriteriaLayoutResult {
  frame: { width: number; height: number };
  total_elementos: number;
  metricas: {
    DE: number;
    VS: number;
    BA: number;
    PR: number;
    UN: number;
    SI: number;
    SE: number;
  };
  score_regresion: number;
  score_regresion_raw?: number;
  score_entropia: number;
  score_entropia_raw?: number;
  score_global?: number;
  nivel_calidad?: string;
  radar_data: MulticriteriaRadarPoint[];
  interpretaciones: { [key: string]: MulticriteriaMetricaItem };
  elementos: BoundingBoxElemento[];
}

