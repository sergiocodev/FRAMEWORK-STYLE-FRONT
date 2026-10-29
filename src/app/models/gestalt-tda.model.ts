export interface DiagramPoint {
  dimension: number;
  birth: number;
  death: number;
  persistence: number;
  is_significant: boolean;
  proj_dist: number;
}

export interface SimplexVertex {
  id: number;
  x: number;
  y: number;
  label: string;
  cluster_id: number;
  color_hex?: string;
  area?: number;
}

export interface SimplexEdge {
  source: number;
  target: number;
  distance: number;
  is_continuation: boolean;
}

export interface SimplexCycle {
  vertices: number[];
  persistence: number;
  label: string;
}

export interface HeuristicScore {
  id: string; // c1, c2, c3, c4, c5
  nombre: string;
  score: number;
  estado: 'cumple' | 'parcial' | 'no_cumple' | 'no_aplica';
  silhouette: number;
  diagnostico: string;
  recomendacion: string;
}

export interface ConflictoGestalt {
  tipo: string;
  descripcion: string;
  dominante: string;
  severidad: string;
}

export interface HallazgoSugerido {
  problema: string;
  severidad: 'critico' | 'mayor' | 'menor';
  fase_origen: number;
  fase_origen_nombre: string;
  heuristica_id: string;
}

export interface GestaltTdaResponse {
  pantalla_id?: number;
  pantalla_nombre: string;
  imagen_url?: string;
  score_gestalt_global: number;
  nivel_cohesion: string;
  silhouette_score_0pd: number;
  silhouette_score_1pd: number;
  epsilon_g_0pd: number;
  epsilon_g_1pd: number;
  total_componentes: number;
  total_lazos: number;
  puntos_0pd: DiagramPoint[];
  puntos_1pd: DiagramPoint[];
  vertices: SimplexVertex[];
  aristas: SimplexEdge[];
  ciclos: SimplexCycle[];
  heuristics: HeuristicScore[];
  conflictos: ConflictoGestalt[];
  hallazgos_sugeridos: HallazgoSugerido[];
}

export interface TdaApplyRequest {
  pantalla_id?: number | null;
  actualizar_checklist?: boolean;
  crear_hallazgos?: boolean;
  min_score_hallazgo?: number;
}
