import { PlagaDeteccion } from '../models/plaga-deteccion.model';

export const PLAGAS_MOCK: PlagaDeteccion[] = [
  { id: 'd-01', imagenUrl: 'https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&w=640&q=60', plaga: 'Mosca blanca', confianza: 96, cultivo: 'Tomate', ubicacion: 'Veracruz', fecha: '2026-02-13 09:14', severidad: 'Alta', estado: 'Confirmada' },
  { id: 'd-02', imagenUrl: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?auto=format&fit=crop&w=640&q=60', plaga: 'Pulgon verde', confianza: 93, cultivo: 'Lechuga', ubicacion: 'Xalapa', fecha: '2026-02-13 10:02', severidad: 'Media', estado: 'Confirmada' },
  { id: 'd-03', imagenUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=640&q=60', plaga: 'Araña roja', confianza: 91, cultivo: 'Fresa', ubicacion: 'Orizaba', fecha: '2026-02-13 10:37', severidad: 'Alta', estado: 'Pendiente' },
  { id: 'd-04', imagenUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=640&q=60', plaga: 'Trips', confianza: 87, cultivo: 'Chile', ubicacion: 'Cordoba', fecha: '2026-02-13 11:11', severidad: 'Media', estado: 'Confirmada' },
  { id: 'd-05', imagenUrl: 'https://images.unsplash.com/photo-1512428813834-c702c7702b78?auto=format&fit=crop&w=640&q=60', plaga: 'Minador', confianza: 90, cultivo: 'Acelga', ubicacion: 'Poza Rica', fecha: '2026-02-13 11:42', severidad: 'Media', estado: 'Descartada' }
];
