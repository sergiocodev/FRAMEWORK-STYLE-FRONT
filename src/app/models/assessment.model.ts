export type HeuristicState = 'cumple' | 'parcial' | 'no_cumple' | 'no_aplica';

export interface SubcriterioItem {
  id: string;
  titulo: string;
  cumple: boolean;
}

export interface ChecklistItem {
  id: string;
  titulo: string;
  descripcion: string;
  cumple: boolean;
  estado?: HeuristicState;
  observacion?: string;
  evaluado_por_ia?: boolean;
  pantalla_id?: number | null;
  pantalla_nombre?: string | null;
  subcriterios?: SubcriterioItem[];
}

export interface VisawiMetrica {
  dimension: string;
  puntaje: number;
  target?: number;
  reactivo?: string;
}

export interface Hallazgo {
  id: number;
  evaluacion_id?: number;
  problema: string;
  severidad: 'critico' | 'mayor' | 'menor';
  fase_origen: number;
  fase_origen_nombre: string;
  resuelto: boolean;
  creado_en?: string;
}

export interface PantallaFase4Alerta {
  id: number;
  tipo: string;
  elemento: string;
  mensaje: string;
  detectado?: string;
  esperado?: string;
}

export interface PantallaFase4Item {
  id: number;
  nodo_id: number;
  nombre_pantalla: string;
  archivo_id?: number;
  archivo_url?: string;
  estado_diseno: string;
  total_alertas: number;
  alertas: PantallaFase4Alerta[];
}

export interface EvaluacionEsteticaResponse {
  id: number;
  proyecto_id: number;
  metodo_seleccionado: string;
  estado: string;
  encuesta_url: string;
  total_respuestas: number;
  respuestas_completadas: number;
  conclusion_estado: string;
  conclusion_texto?: string;
  checklist: ChecklistItem[];
  visawi_metricas: VisawiMetrica[];
  justificaciones: string[];
  creado_en?: string;
  actualizado_en?: string;
  hallazgos: Hallazgo[];

  // Campos avanzados de calidad estética STYLE
  score_estetico?: number;
  nivel_madurez?: string;
  pantallas_fase4?: PantallaFase4Item[];
  calista_metricas?: any;
  visawi_encuestas?: VisawiEncuestaResponse[];
}

export interface HallazgoCreateRequest {
  problema: string;
  severidad: 'critico' | 'mayor' | 'menor';
  fase_origen: number;
  fase_origen_nombre: string;
}

export interface VisawiQuestionnaireItem {
  id: number;
  dimension: string;
  pregunta: string;
  inverso?: boolean;
}

export interface VisawiEncuestaResponse {
  id: number;
  evaluacion_id: number;
  evaluador_nombre: string;
  evaluador_rol: string;
  respuestas: Record<string, number>;
  score_simplicidad: number;
  score_claridad: number;
  score_diversidad: number;
  score_armonia: number;
  score_global: number;
  creado_en?: string;
}

export interface VisawiEncuestaRespuestaInput {
  evaluador_nombre?: string;
  evaluador_rol?: string;
  respuestas: Record<number, number>;
  reiniciar_muestra?: boolean;
}

// Interfaces para Encuesta Pública VisAWI Desatendida (Opción B)
export interface VisawiPublicScreenItem {
  id: number;
  nombre_pantalla: string;
  archivo_url?: string;
  estado_diseno?: string;
}

export interface VisawiPublicDimensionInfo {
  nombre: string;
  descripcion: string;
  items_count: number;
}

export interface VisawiPublicLikertOption {
  valor: number;
  etiqueta: string;
  corta: string;
}

export interface VisawiPublicSurveyInfo {
  proyecto_id: number;
  proyecto_nombre: string;
  proyecto_tipo?: string;
  pantallas: VisawiPublicScreenItem[];
  dimensiones: VisawiPublicDimensionInfo[];
  items: VisawiQuestionnaireItem[];
  escala: VisawiPublicLikertOption[];
}

export interface VisawiPublicSubmissionResponse {
  success: boolean;
  mensaje: string;
  encuesta_id: number;
  evaluador_nombre: string;
  evaluador_rol: string;
  score_simplicidad: number;
  score_claridad: number;
  score_diversidad: number;
  score_armonia: number;
  score_global: number;
  total_evaluaciones_proyecto: number;
}


// -------------------------------------------------------------
// MODELO CALISTA (Delitzas et al., 2023)
// -------------------------------------------------------------
export interface CalistaDimensiones {
  score_estetico?: number | null;
  categoria?: 'Baja' | 'Media' | 'Alta' | 'Pendiente' | string;
  color_hex?: string;
  porcentaje?: number | null;
  balance_visual?: number | null;
  armonia_color?: number | null;
  complejidad_espacio?: number | null;
}

export interface CalistaHallazgoSugerido {
  problema: string;
  severidad: 'critico' | 'mayor' | 'menor';
  fase_origen: number;
  fase_origen_nombre: string;
  sugerencia: string;
}

export interface CalistaPantallaResult {
  pantalla_id: number;
  pantalla_nombre: string;
  imagen_url?: string | null;
  tiene_imagen?: boolean;
  score_estetico?: number | null;
  categoria: 'Baja' | 'Media' | 'Alta' | 'Pendiente' | string;
  color_hex: string;
  porcentaje?: number | null;
  aprobado?: boolean | null;
  diagnostico: string;
  dimensiones?: CalistaDimensiones | null;
  recomendaciones: string[];
  hallazgo_sugerido?: CalistaHallazgoSugerido | null;
}

export interface CalistaModeloInfo {
  id: string;
  nombre: string;
  arquitectura: string;
  descripcion: string;
  es_recomendado: boolean;
  es_valido: boolean;
  parametros?: number | null;
}

export interface CalistaEvaluacionResponse {
  proyecto_id: number;
  score_global: number;
  categoria_global: 'Baja' | 'Media' | 'Alta' | 'Pendiente' | string;
  color_global: string;
  porcentaje_global: number;
  total_pantallas: number;
  pantallas_evaluadas_count?: number;
  pantallas_pendientes_count?: number;
  aprobadas_count: number;
  requieren_ajustes_count: number;
  pantallas: CalistaPantallaResult[];
  pantalla_seleccionada?: CalistaPantallaResult | null;
  fecha_analisis?: string;
  modelo_activo?: string;
  modelos_disponibles?: CalistaModeloInfo[];
}

export interface CalistaApplyRequest {
  pantalla_id: number;
  problema: string;
  severidad: 'critico' | 'mayor' | 'menor';
  fase_origen: number;
  fase_origen_nombre: string;
}


