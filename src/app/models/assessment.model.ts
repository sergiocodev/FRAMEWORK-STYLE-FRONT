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


