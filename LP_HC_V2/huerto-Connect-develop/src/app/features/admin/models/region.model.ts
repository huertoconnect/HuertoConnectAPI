export interface Region {
  id: string;
  nombre: string;
  usuarios: number;
  huertos: number;
  detecciones: number;
  actividad: 'Alta' | 'Media' | 'Baja';
}
