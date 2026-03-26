import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map } from 'rxjs/operators';
import {
  UserChatRecommendation,
  UserCropHistoryItem,
  UserDashboardData,
  UserDashboardService,
  UserGrowthStat,
  UserHuerto,
  UserPestAlert
} from '../../services/user-dashboard.service';

interface UserDashboardVm extends UserDashboardData {
  totalHuertos: number;
  alertasCriticas: number;
  promedioSalud: number;
  maxGrowthValue: number;
  huertosEnRiesgo: number;
  huertosOptimos: number;
  prioridadHoy: UserDashboardPriority[];
  recomendacionesVisibles: UserChatRecommendation[];
  historialVisible: UserCropHistoryItem[];
  mejorHuerto: UserHuerto | null;
}

interface UserDashboardPriority {
  id: string;
  titulo: string;
  detalle: string;
  nivel: 'Alta' | 'Media' | 'Baja';
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserDashboardComponent {
  private readonly userDashboardService = inject(UserDashboardService);

  readonly vm$ = this.userDashboardService.getDashboardData().pipe(
    map((data): UserDashboardVm => {
      const totalHuertos = data.huertos.length;
      const alertasCriticas = data.alertas.filter((item) => item.severidad === 'Critico').length;
      const totalSalud = data.huertos.reduce((acc, item) => acc + item.salud, 0);
      const promedioSalud = totalHuertos > 0 ? Math.round(totalSalud / totalHuertos) : 0;
      const maxGrowthValue = Math.max(1, ...data.estadisticas.map((item) => item.value));
      const huertosEnRiesgo = data.huertos.filter((item) => item.estado !== 'Optimo').length;
      const huertosOptimos = totalHuertos - huertosEnRiesgo;
      const recomendacionesVisibles = data.recomendaciones.slice(0, 4);
      const historialVisible = data.historial.slice(0, 5);
      const mejorHuerto = data.huertos.reduce<UserHuerto | null>((best, current) => {
        if (!best || current.salud > best.salud) {
          return current;
        }

        return best;
      }, null);

      return {
        ...data,
        totalHuertos,
        alertasCriticas,
        promedioSalud,
        maxGrowthValue,
        huertosEnRiesgo,
        huertosOptimos,
        prioridadHoy: this.buildPriorities(data.alertas, data.huertos),
        recomendacionesVisibles,
        historialVisible,
        mejorHuerto
      };
    })
  );

  trackByHuerto(_index: number, item: UserHuerto): string {
    return item.id;
  }

  trackByAlerta(_index: number, item: UserPestAlert): string {
    return item.id;
  }

  trackByRecommendation(_index: number, item: UserChatRecommendation): string {
    return item.id;
  }

  trackByHistorial(_index: number, item: UserCropHistoryItem): string {
    return item.id;
  }

  trackByStat(_index: number, item: UserGrowthStat): string {
    return item.label;
  }

  trackByPriority(_index: number, item: UserDashboardPriority): string {
    return item.id;
  }

  toBarHeight(value: number, maxValue: number): number {
    return Math.max(12, Math.round((value / maxValue) * 100));
  }

  formatAlertDate(value: string): string {
    if (!value) {
      return 'Sin fecha';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short'
    }).format(date);
  }

  getHuertoStatusLabel(estado: UserHuerto['estado']): string {
    if (estado === 'Optimo') {
      return 'Rendimiento estable';
    }

    if (estado === 'Atencion') {
      return 'Requiere seguimiento';
    }

    return 'Atencion inmediata';
  }

  private buildPriorities(alertas: UserPestAlert[], huertos: UserHuerto[]): UserDashboardPriority[] {
    const alertPriorities = alertas.slice(0, 2).map((alerta): UserDashboardPriority => ({
      id: `alert-${alerta.id}`,
      titulo: alerta.titulo,
      detalle: `Alerta ${alerta.severidad.toLowerCase()} detectada el ${this.formatAlertDate(alerta.fecha)}.`,
      nivel: alerta.severidad === 'Critico' ? 'Alta' : alerta.severidad === 'Advertencia' ? 'Media' : 'Baja'
    }));

    const huertoPriorities = huertos
      .filter((huerto) => huerto.estado !== 'Optimo')
      .slice(0, 2)
      .map((huerto): UserDashboardPriority => ({
        id: `huerto-${huerto.id}`,
        titulo: `Revisar ${huerto.nombre}`,
        detalle: `${huerto.region || 'Region sin asignar'} · salud ${huerto.salud}%`,
        nivel: huerto.estado === 'Critico' ? 'Alta' : 'Media'
      }));

    const merged = [...alertPriorities, ...huertoPriorities].slice(0, 4);
    if (merged.length > 0) {
      return merged;
    }

    return [
      {
        id: 'priority-default',
        titulo: 'Todo estable por ahora',
        detalle: 'No se detectan alertas criticas ni huertos en riesgo.',
        nivel: 'Baja'
      }
    ];
  }
}
