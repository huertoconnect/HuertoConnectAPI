export interface PlagaDeteccion {
  id: string;
  imagenUrl: string;
  plaga: string;
  confianza: number;
  cultivo: string;
  ubicacion: string;
  fecha: string;
  severidad: 'Baja' | 'Media' | 'Alta';
  estado: 'Pendiente' | 'Confirmada' | 'Descartada';
}
