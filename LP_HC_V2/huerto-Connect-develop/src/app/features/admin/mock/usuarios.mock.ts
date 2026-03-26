import { Usuario } from '../models/usuario.model';

export const USUARIOS_MOCK: Usuario[] = [
  { id: 'u-01', nombre: 'Sofia Ramirez', correo: 'sofia.ramirez@huerto.mx', region: 'Veracruz Puerto', rol: 'Productor', estado: 'Activo', huertos: 4, ultimaActividad: 'Hace 2 min' },
  { id: 'u-02', nombre: 'Luis Navarro', correo: 'luis.navarro@huerto.mx', region: 'Xalapa', rol: 'Productor', estado: 'Activo', huertos: 2, ultimaActividad: 'Hace 8 min' },
  { id: 'u-03', nombre: 'Paola Diaz', correo: 'paola.diaz@huerto.mx', region: 'Cordoba', rol: 'Tecnico', estado: 'Activo', huertos: 6, ultimaActividad: 'Hace 15 min' },
  { id: 'u-04', nombre: 'Mateo Cruz', correo: 'mateo.cruz@huerto.mx', region: 'Orizaba', rol: 'Productor', estado: 'Inactivo', huertos: 1, ultimaActividad: 'Hace 2 h' },
  { id: 'u-05', nombre: 'Ana Torres', correo: 'ana.torres@huerto.mx', region: 'Poza Rica', rol: 'Productor', estado: 'Activo', huertos: 3, ultimaActividad: 'Hace 21 min' },
  { id: 'u-06', nombre: 'Diego Salas', correo: 'diego.salas@huerto.mx', region: 'Coatzacoalcos', rol: 'Productor', estado: 'Activo', huertos: 2, ultimaActividad: 'Hace 31 min' },
  { id: 'u-07', nombre: 'Mariana Cantu', correo: 'mariana.cantu@huerto.mx', region: 'Boca del Rio', rol: 'Tecnico', estado: 'Suspendido', huertos: 0, ultimaActividad: 'Ayer' },
  { id: 'u-08', nombre: 'Kevin Mora', correo: 'kevin.mora@huerto.mx', region: 'Minatitlan', rol: 'Productor', estado: 'Activo', huertos: 5, ultimaActividad: 'Hace 5 min' },
  { id: 'u-09', nombre: 'Elena Paredes', correo: 'elena.paredes@huerto.mx', region: 'Tuxpan', rol: 'Productor', estado: 'Activo', huertos: 2, ultimaActividad: 'Hace 43 min' },
  { id: 'u-10', nombre: 'Ramon Vera', correo: 'ramon.vera@huerto.mx', region: 'Papantla', rol: 'Admin', estado: 'Activo', huertos: 7, ultimaActividad: 'Hace 1 min' }
];
