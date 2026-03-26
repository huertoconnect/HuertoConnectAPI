import { Region } from '../models/region.model';

export const REGIONES_MOCK: Region[] = [
  { id: 'r-01', nombre: 'Veracruz Puerto', usuarios: 8420, huertos: 2951, detecciones: 122, actividad: 'Alta' },
  { id: 'r-02', nombre: 'Xalapa', usuarios: 6188, huertos: 2105, detecciones: 91, actividad: 'Alta' },
  { id: 'r-03', nombre: 'Cordoba', usuarios: 4280, huertos: 1648, detecciones: 68, actividad: 'Media' },
  { id: 'r-04', nombre: 'Orizaba', usuarios: 3920, huertos: 1450, detecciones: 74, actividad: 'Media' },
  { id: 'r-05', nombre: 'Poza Rica', usuarios: 3015, huertos: 1122, detecciones: 54, actividad: 'Media' },
  { id: 'r-06', nombre: 'Coatzacoalcos', usuarios: 2810, huertos: 980, detecciones: 43, actividad: 'Baja' }
];
