export interface ClienteResponse {
  id: number;
  nombre: string;
}

export interface ProyectoResponse {
  id: number;
  nombre: string;
  tipo: string;
  plataforma?: string;
  estado: string;
  fase_actual_id: number;
  responsable_id: number;
  cliente?: ClienteResponse;
  creado_en: string;
  actualizado_en?: string;
}
