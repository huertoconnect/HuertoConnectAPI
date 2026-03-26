import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, BehaviorSubject } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { MapVeracruzComponent } from '../../components/map-veracruz/map-veracruz.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { AlertasService } from '../../services/alertas.service';
import { ChatbotService } from '../../services/chatbot.service';
import { HuertosService } from '../../services/huertos.service';
import { PlagasService } from '../../services/plagas.service';
import { RegionesService } from '../../services/regiones.service';
import { UsuariosService } from '../../services/usuarios.service';

Chart.register(...registerables);

@Component({
  selector: 'app-mini-chart',
  standalone: true,
  template: `<canvas #chartCanvas style="width: 100%; height: 100%; object-fit: contain;"></canvas>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MiniChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() data: number[] = [];
  @Input() color: 'primary' | 'danger' = 'primary';

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngAfterViewInit() { this.createChart(); }
  ngOnChanges(changes: SimpleChanges) { if (changes['data'] && !changes['data'].firstChange) this.createChart(); }
  ngOnDestroy() { if (this.chartInstance) this.chartInstance.destroy(); }

  private createChart() {
    if (!this.chartCanvas || !this.data || this.data.length === 0) return;
    if (this.chartInstance) this.chartInstance.destroy();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const primary = this.color === 'danger' ? '#ef4444' : '#235347';
    const bg = this.color === 'danger' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(35, 83, 71, 0.4)';

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.data.map((_, i) => String(i)),
        datasets: [{
          data: this.data,
          backgroundColor: bg,
          hoverBackgroundColor: primary,
          borderRadius: 6,
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: { x: { display: false }, y: { display: false } },
        animation: { duration: 800 }
      }
    });
  }
}

interface DashboardKpi {
  label: string;
  value: string;
  delta: string;
  tone: 'up' | 'down' | 'steady';
  icon: string;
  spark: number[];
  chartType?: 'line' | 'area' | 'bar';
}

export type DashboardFilter = 'all' | 'map' | 'ai' | 'stats';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, MapVeracruzComponent, StatusBadgeComponent, MiniChartComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminDashboardComponent {
  private readonly usuariosService = inject(UsuariosService);
  private readonly huertosService = inject(HuertosService);
  private readonly plagasService = inject(PlagasService);
  private readonly alertasService = inject(AlertasService);
  private readonly regionesService = inject(RegionesService);
  private readonly chatbotService = inject(ChatbotService);

  kpis: DashboardKpi[] = [];

  // Filter logic
  filter$ = new BehaviorSubject<DashboardFilter>('all');
  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  setFilter(filter: DashboardFilter) {
    this.filter$.next(filter);
    this.isMenuOpen = false;
  }

  readonly vm$ = combineLatest({
    usuarios: this.usuariosService.getUsuarios(),
    huertos: this.huertosService.getHuertos(),
    plagas: this.plagasService.getDetecciones(),
    alertas: this.alertasService.getAlertas(),
    regiones: this.regionesService.getRegiones(),
    chatMetricas: this.chatbotService.getMetricas(),
    chatConversations: this.chatbotService.getConversaciones(),
    filter: this.filter$
  }).pipe(
    map((data) => {
      const { filter } = data;

      const activosHoy = data.usuarios.filter((item) => item.estado === 'Activo').length;
      const alertasCriticas = data.alertas.filter((item) => item.severidad === 'Critico').length;
      const deteccionesHoy = data.plagas.length;
      const totalChats = data.chatConversations.length;

      // Select KPIs based on the activated filter
      if (filter === 'map') {
        this.kpis = [
          { label: 'Alertas críticas activas', value: alertasCriticas.toString(), delta: '+3 (hoy)', tone: 'down', icon: 'warning-outline', spark: [10, 15, 12, 18, 19, 21, 20], chartType: 'line' },
          { label: 'Regiones en riesgo', value: '3', delta: 'Estable', tone: 'steady', icon: 'map-outline', spark: [3, 3, 2, 4, 3, 3, 3], chartType: 'area' },
          { label: 'Total reportes regionales', value: data.alertas.length.toString(), delta: '+12%', tone: 'down', icon: 'alert-circle-outline', spark: [12, 14, 14, 15, 18, 21, 22], chartType: 'bar' },
        ];
      } else if (filter === 'ai') {
        this.kpis = [
          { label: 'Consultas totales Chatbot', value: totalChats.toString(), delta: '+14.2%', tone: 'up', icon: 'chatbubbles-outline', spark: [30, 36, 44, 47, 53, 60, 69], chartType: 'bar' },
          { label: 'Detecciones de plagas', value: deteccionesHoy.toString(), delta: '-2.1%', tone: 'down', icon: 'bug-outline', spark: [60, 56, 53, 48, 45, 42, 39], chartType: 'area' },
          { label: 'Confianza de la IA', value: '94.2%', delta: '+0.5%', tone: 'up', icon: 'hardware-chip-outline', spark: [90, 91, 91, 92, 93, 94, 94], chartType: 'line' },
        ];
      } else if (filter === 'stats') {
        this.kpis = [
          { label: 'Tendencia de crecimiento', value: '+18.4%', delta: 'Mejora', tone: 'up', icon: 'trending-up-outline', spark: [10, 15, 25, 40, 55, 70, 85], chartType: 'area' },
          { label: 'Usuarios nuevos', value: '24', delta: '+5', tone: 'up', icon: 'person-add-outline', spark: [4, 6, 5, 8, 12, 18, 24], chartType: 'bar' },
          { label: 'Métricas de sanidad', value: '88/100', delta: 'Estable', tone: 'steady', icon: 'heart-outline', spark: [80, 82, 85, 84, 86, 88, 88], chartType: 'line' },
        ];
      } else {
        // All
        this.kpis = [
          { label: 'Usuarios activos hoy', value: activosHoy.toString(), delta: '+6.3%', tone: 'up', icon: 'people-outline', spark: [30, 36, 41, 48, 52, 60, 66], chartType: 'area' },
          { label: 'Huertos registrados', value: data.huertos.length.toString(), delta: '+9.1%', tone: 'up', icon: 'leaf-outline', spark: [18, 22, 24, 28, 31, 35, 40], chartType: 'line' },
          { label: 'Detecciones de plagas hoy', value: deteccionesHoy.toString(), delta: '-2.1%', tone: 'down', icon: 'bug-outline', spark: [60, 56, 53, 48, 45, 42, 39], chartType: 'bar' },
          { label: 'Alertas criticas', value: alertasCriticas.toString(), delta: 'estable', tone: 'steady', icon: 'warning-outline', spark: [20, 20, 19, 18, 19, 18, 17], chartType: 'line' },
          { label: 'Conversaciones chatbot hoy', value: totalChats.toString(), delta: '+14.2%', tone: 'up', icon: 'chatbubbles-outline', spark: [20, 16, 24, 37, 43, 60, 69], chartType: 'area' },
          { label: 'Regiones activas', value: data.regiones.length.toString(), delta: '+2', tone: 'up', icon: 'earth-outline', spark: [22, 22, 23, 24, 24, 25, 26], chartType: 'bar' }
        ];
      }

      return {
        ...data,
        alertas: data.alertas,
        plagas: data.plagas,
        usuariosActivos: activosHoy,
        alertasCriticas,
        deteccionesHoy,
        totalChats,
        growthSeries: [38, 44, 41, 53, 58, 64, 69, 74, 78, 82, 88, 91],
        plagaSeries: [55, 51, 47, 43, 40, 42, 39, 36, 31, 29, 27, 24],
        currentFilter: filter
      };
    })
  );

  trackByIndex(index: number): number {
    return index;
  }
}
