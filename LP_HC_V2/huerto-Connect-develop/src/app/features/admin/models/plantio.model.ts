export interface Plantio {
  id: string;
  nombre: string;
  cultivo: string;
  municipio: string;
  lat: number;
  lng: number;
  salud: number;
  alertas: number;
  severidad: 'Baja' | 'Media' | 'Alta';
}
