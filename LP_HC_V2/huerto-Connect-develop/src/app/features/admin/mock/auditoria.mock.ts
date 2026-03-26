import { AuditoriaLog } from '../models/auditoria-log.model';

export const AUDITORIA_MOCK: AuditoriaLog[] = [
  { id: 'l-01', actor: 'admin@huerto.ai', accion: 'Actualizo configuracion de alertas', modulo: 'Configuracion', fecha: '2026-02-13 08:42', ip: '192.168.1.11' },
  { id: 'l-02', actor: 'ia-pipeline', accion: 'Modelo de plagas v2.7 desplegado', modulo: 'Plagas IA', fecha: '2026-02-13 08:11', ip: '10.10.0.12' },
  { id: 'l-03', actor: 'sofia.ramirez@huerto.mx', accion: 'Creo nuevo huerto Terra Norte', modulo: 'Huertos', fecha: '2026-02-13 07:58', ip: '192.168.2.45' },
  { id: 'l-04', actor: 'system', accion: 'Sincronizacion regional completada', modulo: 'Regiones', fecha: '2026-02-13 07:45', ip: '10.0.0.5' }
];
