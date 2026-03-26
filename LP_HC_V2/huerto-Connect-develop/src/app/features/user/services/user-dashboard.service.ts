import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HuertosService } from '../../../core/services/huertos.service';
import { PlagasService } from '../../../core/services/plagas.service';
import { CultivosService } from '../../../core/services/cultivos.service';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { RegionesService } from '../../../core/services/regiones.service';
import {
  Alerta as ApiAlerta,
  ChatConversacion as ApiChatConversacion,
  ChatMensaje as ApiChatMensaje,
  Cultivo as ApiCultivo,
  Huerto as ApiHuerto,
  Prediccion as ApiPrediccion,
  Region as ApiRegion,
  Siembra as ApiSiembra,
} from '../../../core/models/api.models';

export interface UserHuerto {
  id: string;
  nombre: string;
  region: string;
  estado: 'Optimo' | 'Atencion' | 'Critico';
  cultivosActivos: number;
  salud: number;
}

export interface UserPestAlert {
  id: string;
  titulo: string;
  severidad: 'Seguro' | 'Advertencia' | 'Critico';
  fecha: string;
}

export interface UserChatRecommendation {
  id: string;
  tema: string;
  recomendacion: string;
}

export interface UserCropHistoryItem {
  id: string;
  cultivo: string;
  huerto: string;
  temporada: string;
  estado: string;
}

export interface UserGrowthStat {
  label: string;
  value: number;
}

export interface UserDashboardData {
  huertos: UserHuerto[];
  alertas: UserPestAlert[];
  recomendaciones: UserChatRecommendation[];
  historial: UserCropHistoryItem[];
  estadisticas: UserGrowthStat[];
}

@Injectable({ providedIn: 'root' })
export class UserDashboardService {
  private readonly huertosService = inject(HuertosService);
  private readonly plagasService = inject(PlagasService);
  private readonly cultivosService = inject(CultivosService);
  private readonly chatbotService = inject(ChatbotService);
  private readonly regionesService = inject(RegionesService);

  getDashboardData(): Observable<UserDashboardData> {
    return forkJoin({
      huertos: this.huertosService.list().pipe(catchError(() => of([]))),
      alertas: this.plagasService.getAlertas().pipe(catchError(() => of([]))),
      predicciones: this.plagasService.getPredicciones().pipe(catchError(() => of([]))),
      conversaciones: this.chatbotService.getConversaciones().pipe(catchError(() => of([]))),
      cultivos: this.cultivosService.list().pipe(catchError(() => of([]))),
      regiones: this.regionesService.list().pipe(catchError(() => of([]))),
    }).pipe(
      switchMap((sources) => {
        if (sources.huertos.length === 0) {
          return of(this.buildDashboardData(sources, new Map<string, ApiSiembra[]>()));
        }

        const siembraRequests = sources.huertos.map((huerto) =>
          this.cultivosService.getSiembrasByHuerto(huerto.id).pipe(
            catchError(() => of([] as ApiSiembra[])),
            map((siembras) => ({ huertoId: huerto.id, siembras }))
          )
        );

        return forkJoin(siembraRequests).pipe(
          map((entries) => {
            const siembrasByHuerto = new Map<string, ApiSiembra[]>(
              entries.map((entry) => [entry.huertoId, entry.siembras])
            );
            return this.buildDashboardData(sources, siembrasByHuerto);
          })
        );
      }),
      catchError(() => of(this.emptyDashboardData()))
    );
  }

  getMyHuertos(): Observable<UserHuerto[]> {
    return this.huertosService.list().pipe(
      map((items) => items.map((h) => this.toUserHuerto(h, h.municipio || 'Region sin asignar', 0))),
      catchError(() => of([]))
    );
  }

  private buildDashboardData(
    sources: {
      huertos: ApiHuerto[];
      alertas: ApiAlerta[];
      predicciones: ApiPrediccion[];
      conversaciones: ApiChatConversacion[];
      cultivos: ApiCultivo[];
      regiones: ApiRegion[];
    },
    siembrasByHuerto: Map<string, ApiSiembra[]>
  ): UserDashboardData {
    const regionNameById = new Map<string, string>();
    sources.regiones.forEach((region) => {
      regionNameById.set(region.id, region.nombre);
    });

    const mappedHuertos = sources.huertos.map((huerto) => {
      const regionName = huerto.region_id ? regionNameById.get(huerto.region_id) : undefined;
      const fallbackRegion = huerto.municipio || 'Region sin asignar';
      const cultivosActivos = siembrasByHuerto.get(huerto.id)?.length ?? 0;
      return this.toUserHuerto(huerto, regionName || fallbackRegion, cultivosActivos);
    });

    const mappedAlertas = [...sources.alertas]
      .sort((a, b) => this.toTime(b.created_at) - this.toTime(a.created_at))
      .slice(0, 6)
      .map((alerta) => this.toUserAlert(alerta));

    return {
      huertos: mappedHuertos,
      alertas: mappedAlertas,
      recomendaciones: this.buildRecommendations(sources.predicciones, sources.conversaciones),
      historial: this.buildHistory(siembrasByHuerto, mappedHuertos, sources.cultivos),
      estadisticas: this.buildGrowthStats(sources.huertos),
    };
  }

  private toUserHuerto(h: ApiHuerto, regionName: string, cultivosActivos: number): UserHuerto {
    const estado = h.estado?.toLowerCase();
    let mappedEstado: 'Optimo' | 'Atencion' | 'Critico' = 'Optimo';
    if (estado?.includes('crit')) mappedEstado = 'Critico';
    else if (estado?.includes('alert') || estado?.includes('aten')) mappedEstado = 'Atencion';

    return {
      id: h.id,
      nombre: h.nombre,
      region: regionName,
      estado: mappedEstado,
      cultivosActivos,
      salud: h.salud ?? 100,
    };
  }

  private toUserAlert(a: ApiAlerta): UserPestAlert {
    const severity = a.severidad?.toLowerCase() ?? '';
    let sev: 'Seguro' | 'Advertencia' | 'Critico' = 'Seguro';
    if (severity.includes('alta') || severity.includes('crit')) sev = 'Critico';
    else if (severity.includes('media')) sev = 'Advertencia';

    return {
      id: a.id,
      titulo: a.mensaje ?? 'Alerta',
      severidad: sev,
      fecha: a.created_at ?? '',
    };
  }

  private buildRecommendations(
    predicciones: ApiPrediccion[],
    conversaciones: ApiChatConversacion[]
  ): UserChatRecommendation[] {
    const fromPredicciones: UserChatRecommendation[] = [...predicciones]
      .filter((item) => !!item.recomendacion)
      .sort((a, b) => (b.probabilidad ?? 0) - (a.probabilidad ?? 0))
      .slice(0, 4)
      .map((item, index) => ({
        id: `pred-${item.id}`,
        tema: this.predictionTopic(item, index),
        recomendacion: this.cleanText(item.recomendacion ?? ''),
      }));

    if (fromPredicciones.length >= 4) {
      return fromPredicciones;
    }

    const fromChat = this.extractChatRecommendations(conversaciones);
    const all = [...fromPredicciones, ...fromChat];
    const seen = new Set<string>();
    return all.filter((item) => {
      const key = `${item.tema}|${item.recomendacion}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    }).slice(0, 4);
  }

  private extractChatRecommendations(conversaciones: ApiChatConversacion[]): UserChatRecommendation[] {
    const ordered = [...conversaciones].sort(
      (a, b) => this.toTime(b.actualizada_at ?? b.creada_at) - this.toTime(a.actualizada_at ?? a.creada_at)
    );

    const recommendations: UserChatRecommendation[] = [];
    for (const conversation of ordered) {
      const assistantMessage = this.pickAssistantMessage(conversation.mensajes ?? []);
      if (!assistantMessage) {
        continue;
      }

      recommendations.push({
        id: `chat-${conversation.id}`,
        tema: this.inferTopic(assistantMessage),
        recomendacion: this.toSummary(assistantMessage)
      });
    }

    return recommendations.slice(0, 4);
  }

  private buildHistory(
    siembrasByHuerto: Map<string, ApiSiembra[]>,
    huertos: UserHuerto[],
    cultivos: ApiCultivo[]
  ): UserCropHistoryItem[] {
    const cultivoById = new Map<string, string>();
    cultivos.forEach((item) => {
      cultivoById.set(item.id, item.nombre);
    });

    const huertoById = new Map<string, string>();
    huertos.forEach((item) => {
      huertoById.set(item.id, item.nombre);
    });

    const historySource: Array<{ huertoId: string; siembra: ApiSiembra }> = [];
    siembrasByHuerto.forEach((siembras, huertoId) => {
      siembras.forEach((siembra) => {
        historySource.push({ huertoId, siembra });
      });
    });

    return historySource
      .sort((a, b) => this.toTime(b.siembra.fecha_siembra) - this.toTime(a.siembra.fecha_siembra))
      .slice(0, 10)
      .map(({ huertoId, siembra }) => ({
        id: siembra.id,
        cultivo: cultivoById.get(siembra.cultivo_id) ?? 'Cultivo sin catalogo',
        huerto: huertoById.get(huertoId) ?? 'Huerto sin nombre',
        temporada: this.toSeasonLabel(siembra.fecha_siembra),
        estado: this.mapSiembraStatus(siembra.estado),
      }));
  }

  private buildGrowthStats(huertos: ApiHuerto[]): UserGrowthStat[] {
    return [...huertos]
      .sort((a, b) => this.toTime(a.created_at) - this.toTime(b.created_at))
      .slice(-5)
      .map((huerto, index) => ({
        label: this.toShortLabel(huerto.nombre, index),
        value: this.clamp(huerto.salud ?? 0, 0, 100),
      }));
  }

  private predictionTopic(prediccion: ApiPrediccion, index: number): string {
    const confidence = prediccion.probabilidad != null
      ? ` (${Math.round(prediccion.probabilidad)}%)`
      : '';

    if (prediccion.plaga_id) {
      return `Prevencion de plagas${confidence}`;
    }
    if (prediccion.cultivo_id) {
      return `Recomendacion de cultivo${confidence}`;
    }
    if (prediccion.huerto_id) {
      return `Accion sugerida por huerto${confidence}`;
    }
    return `Sugerencia IA #${index + 1}${confidence}`;
  }

  private pickAssistantMessage(messages: ApiChatMensaje[]): string | null {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      const content = this.cleanText(message?.contenido ?? '');
      if (message?.rol === 'assistant' && content.length > 16) {
        return content;
      }
    }
    return null;
  }

  private inferTopic(text: string): string {
    const normalized = text.toLowerCase();
    if (normalized.includes('plaga') || normalized.includes('hongo') || normalized.includes('insecto')) {
      return 'Prevencion de plagas';
    }
    if (normalized.includes('riego') || normalized.includes('humedad') || normalized.includes('agua')) {
      return 'Ajuste de riego';
    }
    if (normalized.includes('fertiliz') || normalized.includes('nutri')) {
      return 'Nutricion de cultivo';
    }
    return 'Recomendacion del asistente';
  }

  private toSummary(text: string): string {
    const sentence = text.split(/[.!?]/).find((part) => part.trim().length > 16);
    if (!sentence) {
      return text.slice(0, 220);
    }
    return sentence.trim();
  }

  private mapSiembraStatus(value: string | undefined): string {
    const normalized = (value ?? '').toLowerCase();
    if (normalized.includes('cosech')) {
      return 'Cosechado';
    }
    if (normalized.includes('perd')) {
      return 'Perdido';
    }
    if (normalized.includes('activ')) {
      return 'Activo';
    }
    return value || 'Registrado';
  }

  private toSeasonLabel(value: string | undefined): string {
    if (!value) {
      return 'Sin fecha';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Sin fecha';
    }

    const month = parsed.getMonth() + 1;
    const year = parsed.getFullYear();

    if (month === 12 || month <= 2) {
      return `Invierno ${year}`;
    }
    if (month <= 5) {
      return `Primavera ${year}`;
    }
    if (month <= 8) {
      return `Verano ${year}`;
    }
    return `Otono ${year}`;
  }

  private toShortLabel(name: string, index: number): string {
    const clean = (name || '').trim();
    if (!clean) {
      return `H${index + 1}`;
    }
    return clean.length <= 8 ? clean : `${clean.slice(0, 7)}...`;
  }

  private emptyDashboardData(): UserDashboardData {
    return {
      huertos: [],
      alertas: [],
      recomendaciones: [],
      historial: [],
      estadisticas: [],
    };
  }

  private cleanText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private toTime(value: string | undefined | null): number {
    if (!value) {
      return 0;
    }

    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
