export interface Cultivo {
  id: string;
  nombre: string;
  temporada: string;
  dificultad: 'Baja' | 'Media' | 'Alta';
  riego: string;
  fertilizacion: string;
  activo: boolean;
}
