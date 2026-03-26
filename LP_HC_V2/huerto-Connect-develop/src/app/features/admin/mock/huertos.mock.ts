import { Huerto } from '../models/huerto.model';

export const HUERTOS_MOCK: Huerto[] = [
  { id: 'h-01', nombre: 'Terra Norte', usuario: 'Sofia Ramirez', municipio: 'Veracruz', region: 'Veracruz Puerto', cultivosActivos: 12, estado: 'Optimo', salud: 91, alertas: 0 },
  { id: 'h-02', nombre: 'Azotea Viva', usuario: 'Luis Navarro', municipio: 'Xalapa', region: 'Xalapa', cultivosActivos: 8, estado: 'Atencion', salud: 72, alertas: 2 },
  { id: 'h-03', nombre: 'Huerto Central', usuario: 'Paola Diaz', municipio: 'Cordoba', region: 'Cordoba', cultivosActivos: 14, estado: 'Optimo', salud: 88, alertas: 1 },
  { id: 'h-04', nombre: 'Patio Verde', usuario: 'Mateo Cruz', municipio: 'Orizaba', region: 'Orizaba', cultivosActivos: 6, estado: 'Critico', salud: 49, alertas: 5 },
  { id: 'h-05', nombre: 'BioLote 7', usuario: 'Ana Torres', municipio: 'Poza Rica', region: 'Poza Rica', cultivosActivos: 9, estado: 'Atencion', salud: 68, alertas: 2 },
  { id: 'h-06', nombre: 'Huerto Delta', usuario: 'Diego Salas', municipio: 'Coatzacoalcos', region: 'Coatzacoalcos', cultivosActivos: 11, estado: 'Optimo', salud: 86, alertas: 1 }
];
