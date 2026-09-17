export interface InvestigacionInformeResponse {
  proyecto_id: number;
  problema?: string;
  objetivo?: string;
  producto?: string;
  expectativas?: string;
  referencias?: {url: string, notas: string}[];
  analisis_actual?: string;
  restricciones?: string;
  identidad_marca?: {tieneManual: boolean, colores: string, notas: string};
  conclusiones_fase2?: string;
  actualizado_en: string;
}

export interface ArquetipoNecesidadResponse {
  id: number;
  arquetipo_id: number;
  descripcion: string;
  orden?: number;
}

export interface ArquetipoUsuarioResponse {
  id: number;
  proyecto_id: number;
  nombre: string;
  etiqueta?: string;
  orden?: number;
  avatar_archivo_id?: number;
  necesidades: ArquetipoNecesidadResponse[];
}

export interface ArchivoResponse {
  id: number;
  proyecto_id: number;
  fase_id?: number;
  contexto_tipo?: string;
  contexto_id?: number;
  nombre_original: string;
  mime_type?: string;
  tamano_bytes?: number;
  subido_por: number;
  subido_en: string;
}
