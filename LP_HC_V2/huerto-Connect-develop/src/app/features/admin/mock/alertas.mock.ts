import { Alerta } from '../models/alerta.model';

export const ALERTAS_MOCK: Alerta[] = [
  { id: 'a-01', titulo: 'Incremento de plaga en tomate', tipo: 'Plaga', severidad: 'Critico', estado: 'Abierta', region: 'Veracruz Puerto', fecha: '2026-02-13 11:02', responsable: 'Equipo IA' },
  { id: 'a-02', titulo: 'Baja humedad en 18 huertos', tipo: 'Riego', severidad: 'Advertencia', estado: 'En progreso', region: 'Xalapa', fecha: '2026-02-13 10:44', responsable: 'Ops Agricolas' },
  { id: 'a-03', titulo: 'Falla intermitente de sensor', tipo: 'Sensor', severidad: 'Advertencia', estado: 'Abierta', region: 'Orizaba', fecha: '2026-02-13 09:26', responsable: 'Soporte' },
  { id: 'a-04', titulo: 'Pipeline de deteccion estable', tipo: 'Sistema', severidad: 'Seguro', estado: 'Resuelta', region: 'Global', fecha: '2026-02-13 08:41', responsable: 'System' },
  { id: 'a-05', titulo: 'Sospecha de hongo foliar', tipo: 'Plaga', severidad: 'Advertencia', estado: 'En progreso', region: 'Cordoba', fecha: '2026-02-13 08:03', responsable: 'Equipo IA' }
];
