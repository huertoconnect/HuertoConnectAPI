import { Cultivo } from '../models/cultivo.model';

export const CULTIVOS_MOCK: Cultivo[] = [
  { id: 'c-01', nombre: 'Tomate', temporada: 'Primavera-Verano', dificultad: 'Media', riego: 'Moderado', fertilizacion: 'NPK 20-20-20', activo: true },
  { id: 'c-02', nombre: 'Lechuga', temporada: 'Todo el anio', dificultad: 'Baja', riego: 'Frecuente', fertilizacion: 'Organica ligera', activo: true },
  { id: 'c-03', nombre: 'Chile', temporada: 'Primavera', dificultad: 'Media', riego: 'Moderado', fertilizacion: 'Nitrogeno alto', activo: true },
  { id: 'c-04', nombre: 'Fresa', temporada: 'Otonio-Invierno', dificultad: 'Alta', riego: 'Controlado', fertilizacion: 'Potasio alto', activo: true },
  { id: 'c-05', nombre: 'Acelga', temporada: 'Todo el anio', dificultad: 'Baja', riego: 'Moderado', fertilizacion: 'Composta', activo: true }
];
