import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-estadisticas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-estadisticas.component.html',
  styleUrls: ['./admin-estadisticas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminEstadisticasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('usuariosRegionCanvas') usuariosRegionCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('plagasSeveridadCanvas') plagasSeveridadCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chatbotTemaCanvas') chatbotTemaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('comparativaRegionalCanvas') comparativaRegionalCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly charts: Chart[] = [];

  ngAfterViewInit() {
    this.renderCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private renderCharts() {
    this.destroyCharts();

    const colors = {
      text: '#173831', // secondary dark
      textMuted: '#8CB79B', // green soft
      line: 'rgba(35, 83, 71, 0.1)',
      primary: '#051F20', // primary dark
      accent: '#235347', // green deep
      accentSoft: '#8CB79B',
      warn: '#eab308',
      danger: '#ef4444',
      bgBase: 'transparent'
    };

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Default false to keep it extra clean
          position: 'top' as const,
          align: 'end' as const,
          labels: {
            color: colors.textMuted,
            usePointStyle: true,
            boxWidth: 6,
            padding: 20,
            font: { family: 'Inter', size: 12, weight: 500 }
          }
        },
        tooltip: {
          backgroundColor: '#051F20',
          titleColor: '#8CB79B',
          bodyColor: '#ffffff',
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          intersect: false,
          mode: 'index' as const,
          titleFont: { family: 'Inter', size: 12 },
          bodyFont: { family: 'Inter', size: 13, weight: 600 }
        }
      },
      animation: { duration: 1000, easing: 'easeOutQuart' as const }
    };

    const usuariosPorRegion = [
      { label: 'Veracruz Puerto', value: 1280 },
      { label: 'Xalapa', value: 940 },
      { label: 'Cordoba', value: 760 },
      { label: 'Orizaba', value: 540 },
      { label: 'Poza Rica', value: 470 },
      { label: 'Coatzacoalcos', value: 410 }
    ];

    // Bar chart context for precise gradients
    const uCtx = this.usuariosRegionCanvas.nativeElement.getContext('2d')!;
    const uGradient = uCtx.createLinearGradient(0, 0, 0, 300);
    uGradient.addColorStop(0, colors.accent);
    uGradient.addColorStop(1, colors.accentSoft);

    const usuariosConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: usuariosPorRegion.map((item) => item.label),
        datasets: [{
          label: 'Usuarios',
          data: usuariosPorRegion.map((item) => item.value),
          backgroundColor: uGradient,
          hoverBackgroundColor: colors.primary,
          borderRadius: 4,
          maxBarThickness: 24, // Thinner bars
          borderWidth: 0
        }]
      },
      options: {
        ...commonOptions,
        scales: this.buildScales(colors)
      }
    };

    const plagasPorSeveridad = [
      { label: 'Baja', value: 112 },
      { label: 'Media', value: 86 },
      { label: 'Alta', value: 41 }
    ];

    const plagasConfig: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: plagasPorSeveridad.map((item) => item.label),
        datasets: [{
          data: plagasPorSeveridad.map((item) => item.value),
          backgroundColor: [colors.accentSoft, colors.warn, colors.danger],
          hoverOffset: 6,
          borderWidth: 0
        }]
      },
      options: {
        ...commonOptions,
        cutout: '85%', // Ultra thin ring
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            ...commonOptions.plugins.tooltip,
            displayColors: true,
            boxPadding: 4
          },
          legend: {
            ...commonOptions.plugins.legend,
            display: true,
            position: 'right' as const,
            align: 'center' as const
          }
        }
      }
    };

    const consultasPorTema = [
      { label: 'Riego', value: 6200 },
      { label: 'Plagas', value: 4300 },
      { label: 'Fertilizacion', value: 3800 },
      { label: 'Calendario', value: 2900 },
      { label: 'Otros', value: 1500 }
    ];

    const chatbotConfig: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: consultasPorTema.map((item) => item.label),
        datasets: [{
          label: 'Consultas',
          data: consultasPorTema.map((item) => item.value),
          backgroundColor: 'rgba(35, 83, 71, 0.1)',
          hoverBackgroundColor: colors.accent,
          borderRadius: 20, // Pill shaped bars
          maxBarThickness: 12,
          borderWidth: 0
        }]
      },
      options: {
        ...commonOptions,
        indexAxis: 'y',
        scales: {
          x: { display: false, grid: { display: false } }, // Completely hide x axis
          y: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: colors.text, padding: 12, font: { family: 'Inter', weight: 500, size: 12 } }
          }
        }
      }
    };

    const comparativaRegional = {
      labels: ['Veracruz', 'Xalapa', 'Cordoba', 'Orizaba', 'Poza Rica', 'Coatzacoalcos'],
      huertos: [860, 720, 640, 520, 470, 410],
      detecciones: [124, 108, 92, 76, 62, 55]
    };

    const cCtx = this.comparativaRegionalCanvas.nativeElement.getContext('2d')!;
    const cGradient1 = cCtx.createLinearGradient(0, 0, 0, 300);
    cGradient1.addColorStop(0, 'rgba(35, 83, 71, 0.4)');
    cGradient1.addColorStop(1, 'rgba(35, 83, 71, 0.0)');

    const cGradient2 = cCtx.createLinearGradient(0, 0, 0, 300);
    cGradient2.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
    cGradient2.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    const comparativaConfig: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: comparativaRegional.labels,
        datasets: [
          {
            label: 'Huertos',
            data: comparativaRegional.huertos,
            borderColor: colors.accent,
            backgroundColor: cGradient1,
            borderWidth: 2,
            tension: 0.45,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderColor: colors.accent,
            pointBorderWidth: 2
          },
          {
            label: 'Detecciones',
            data: comparativaRegional.detecciones,
            borderColor: colors.danger,
            backgroundColor: cGradient2,
            borderWidth: 2,
            tension: 0.45,
            fill: true,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#fff',
            pointBorderColor: colors.danger,
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        ...commonOptions,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          ...commonOptions.plugins,
          legend: {
            ...commonOptions.plugins.legend,
            display: true // Show legend here since there are two datasets
          }
        },
        scales: {
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: colors.textMuted, font: { family: 'Inter', size: 12 } }
          },
          y: {
            border: { display: false },
            grid: { display: false }, // Completely hide inner lines
            ticks: { display: false } // Hide y-axis numbers to keep it ultra slick
          }
        }
      }
    };

    this.charts.push(
      new Chart(uCtx, usuariosConfig),
      new Chart(this.plagasSeveridadCanvas.nativeElement.getContext('2d')!, plagasConfig),
      new Chart(this.chatbotTemaCanvas.nativeElement.getContext('2d')!, chatbotConfig),
      new Chart(cCtx, comparativaConfig)
    );
  }

  private destroyCharts() {
    while (this.charts.length > 0) {
      this.charts.pop()?.destroy();
    }
  }

  private buildScales(colors: any) {
    return {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: colors.textMuted, font: { family: 'Inter', size: 12 } }
      },
      y: {
        border: { display: false },
        grid: { color: '#f1f5f9', tickLength: 0 },
        ticks: { color: colors.textMuted, padding: 10, font: { family: 'Inter', size: 12 } }
      }
    };
  }
}
