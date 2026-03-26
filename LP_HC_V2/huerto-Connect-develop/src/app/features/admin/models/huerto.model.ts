export interface Huerto {
  id: string;
  nombre: string;
  usuario: string;
  municipio: string;
  region: string;
  cultivosActivos: number;
  estado: 'Optimo' | 'Atencion' | 'Critico';
  salud: number;
  alertas: number;
}
