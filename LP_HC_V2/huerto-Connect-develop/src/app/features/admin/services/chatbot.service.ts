import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type {
  ChatConversation,
  ChatMetric,
} from '../mock/chatbot.mock';
import { ChatConversacion } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/chatbot`;

  getMetricas(): Observable<ChatMetric[]> {
    // No hay endpoint de métricas de chatbot directo en la API.
    // Las métricas se calculan a partir de las conversaciones.
    return this.getConversaciones().pipe(
      map((convs) => {
        const total = convs.length || 1;
        // Agrupar por tema para generar métricas
        const temaMap = new Map<string, number>();
        convs.forEach((c) => {
          const t = c.tema || 'Otros';
          temaMap.set(t, (temaMap.get(t) ?? 0) + 1);
        });
        return Array.from(temaMap.entries()).map(([tema, count]) => ({
          tema,
          total: count,
          porcentaje: Math.round((count / total) * 100),
        }));
      }),
      catchError(() => of([]))
    );
  }

  getConversaciones(): Observable<ChatConversation[]> {
    return this.http.get<ChatConversacion[]>(`${this.base}/conversaciones`).pipe(
      map((items) =>
        items.map((c) => ({
          id: c.id,
          usuario: c.usuario_id ?? '',
          region: '',
          tema: (c.mensajes && c.mensajes.length > 0) ? this.guessTopicFromLastMsg(c.mensajes[c.mensajes.length - 1]?.contenido ?? '') : 'General',
          ultimoMensaje: (c.mensajes && c.mensajes.length > 0) ? c.mensajes[c.mensajes.length - 1]?.contenido ?? '' : '',
          fecha: c.actualizada_at ?? c.creada_at ?? '',
        }))
      ),
      catchError(() => of([]))
    );
  }

  private guessTopicFromLastMsg(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('plaga') || m.includes('insecto') || m.includes('hongo')) return 'Plagas';
    if (m.includes('riego') || m.includes('agua')) return 'Riego';
    if (m.includes('fertiliz')) return 'Fertilizacion';
    if (m.includes('calendario') || m.includes('siembra') || m.includes('cuando')) return 'Calendario';
    return 'Otros';
  }
}
