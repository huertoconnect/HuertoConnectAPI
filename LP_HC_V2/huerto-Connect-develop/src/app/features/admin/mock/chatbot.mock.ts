export interface ChatMetric {
  tema: string;
  total: number;
  porcentaje: number;
}

export interface ChatConversation {
  id: string;
  usuario: string;
  region: string;
  tema: string;
  ultimoMensaje: string;
  fecha: string;
}

export const CHAT_METRICS_MOCK: ChatMetric[] = [
  { tema: 'Riego', total: 6243, porcentaje: 33 },
  { tema: 'Plagas', total: 4391, porcentaje: 23 },
  { tema: 'Fertilizacion', total: 3810, porcentaje: 20 },
  { tema: 'Calendario', total: 2884, porcentaje: 15 },
  { tema: 'Otros', total: 1604, porcentaje: 9 }
];

export const CHAT_CONVERSATIONS_MOCK: ChatConversation[] = [
  { id: 'ch-01', usuario: 'Sofia Ramirez', region: 'Veracruz', tema: 'Plagas', ultimoMensaje: 'Detecte manchas en hojas de tomate', fecha: 'Hace 2 min' },
  { id: 'ch-02', usuario: 'Luis Navarro', region: 'Xalapa', tema: 'Riego', ultimoMensaje: 'Recomienda frecuencia por clima lluvioso', fecha: 'Hace 8 min' },
  { id: 'ch-03', usuario: 'Paola Diaz', region: 'Cordoba', tema: 'Calendario', ultimoMensaje: 'Cuando iniciar siembra de fresa', fecha: 'Hace 18 min' }
];
