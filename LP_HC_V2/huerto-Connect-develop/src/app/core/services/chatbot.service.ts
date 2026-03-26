import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChatbotSendRequest,
  ChatbotSendResponse,
  ChatConversacion,
  MessageResponse,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/chatbot`;

  /**
   * Envía un mensaje al chatbot de IA.
   * Si se proporciona `chat_id`, continúa la conversación existente;
   * si no, inicia una nueva.
   */
  sendMessage(payload: ChatbotSendRequest): Observable<ChatbotSendResponse> {
    return this.http.post<ChatbotSendResponse>(`${this.base}/mensajes`, payload);
  }

  /** Lista el historial de conversaciones del usuario. */
  getConversaciones(): Observable<ChatConversacion[]> {
    return this.http.get<ChatConversacion[]>(`${this.base}/conversaciones`);
  }

  /** Elimina una conversación por su ID. */
  deleteConversacion(chatId: string): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(
      `${this.base}/conversaciones/${chatId}`
    );
  }
}
