export interface Alerta {
  id: string;
  titulo: string;
  tipo: 'Plaga' | 'Riego' | 'Sensor' | 'Sistema';
  severidad: 'Seguro' | 'Advertencia' | 'Critico';
  estado: 'Abierta' | 'En progreso' | 'Resuelta';
  region: string;
  fecha: string;
  responsable: string;
}
