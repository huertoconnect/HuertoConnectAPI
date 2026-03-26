export interface ReporteItem {
  id: string;
  nombre: string;
  tipo: string;
  fecha: string;
  estado: 'Generado' | 'En proceso';
}

export interface IntegracionItem {
  nombre: string;
  estado: 'Conectado' | 'Degradado' | 'Desconectado';
  ultimaRevision: string;
}

export const REPORTES_MOCK: ReporteItem[] = [
  { id: 'rpt-01', nombre: 'Reporte semanal de adopcion IA', tipo: 'Analitica', fecha: '2026-02-13', estado: 'Generado' },
  { id: 'rpt-02', nombre: 'Reporte de plagas por region', tipo: 'Sanidad', fecha: '2026-02-12', estado: 'Generado' },
  { id: 'rpt-03', nombre: 'Reporte de uso del chatbot', tipo: 'Conversacional', fecha: '2026-02-11', estado: 'En proceso' }
];

export const INTEGRACIONES_MOCK: IntegracionItem[] = [
  { nombre: 'OpenWeather API', estado: 'Conectado', ultimaRevision: 'Hace 3 min' },
  { nombre: 'Maps Service', estado: 'Conectado', ultimaRevision: 'Hace 6 min' },
  { nombre: 'Vision API', estado: 'Conectado', ultimaRevision: 'Hace 2 min' },
  { nombre: 'Push Notifications', estado: 'Degradado', ultimaRevision: 'Hace 14 min' }
];
