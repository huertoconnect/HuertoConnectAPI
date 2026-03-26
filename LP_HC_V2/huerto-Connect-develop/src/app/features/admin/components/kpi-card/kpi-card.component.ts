import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables, ChartTypeRegistry } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class KpiCardComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() label = '';
  @Input() value = '';
  @Input() delta = '';
  @Input() icon = 'analytics-outline';
  @Input() tone: 'up' | 'down' | 'steady' = 'steady';
  @Input() spark: number[] = [];
  @Input() chartType: 'line' | 'area' | 'bar' = 'area';

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chartInstance: Chart | null = null;

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['spark'] && !changes['spark'].firstChange) || (changes['chartType'] && !changes['chartType'].firstChange)) {
      this.createChart();
    }
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private createChart() {
    if (!this.chartCanvas || !this.spark || this.spark.length === 0) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    let primaryColor = '#8CB79B';
    let gradientStart = 'rgba(140, 183, 155, 0.4)';
    let gradientEnd = 'rgba(140, 183, 155, 0.0)';

    if (this.tone === 'up') {
      primaryColor = '#235347';
      gradientStart = 'rgba(35, 83, 71, 0.3)';
    } else if (this.tone === 'down') {
      primaryColor = '#ef4444';
      gradientStart = 'rgba(239, 68, 68, 0.2)';
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, gradientStart);
    gradient.addColorStop(1, gradientEnd);

    const isBar = this.chartType === 'bar';
    const isLine = this.chartType === 'line' || this.chartType === 'area';
    const fill = this.chartType === 'area';

    let actualType: keyof ChartTypeRegistry = isBar ? 'bar' : 'line';

    this.chartInstance = new Chart(ctx, {
      type: actualType,
      data: {
        labels: this.spark.map((_, i) => i.toString()),
        datasets: [{
          data: this.spark,
          borderColor: isBar ? 'transparent' : primaryColor,
          backgroundColor: isBar ? primaryColor : (fill ? gradient : 'transparent'),
          borderWidth: isBar ? 0 : 2,
          pointRadius: 0,
          pointHoverRadius: isLine ? 4 : 0,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: primaryColor,
          pointBorderWidth: 2,
          fill: fill,
          tension: 0.4,
          borderRadius: isBar ? 4 : 0,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            backgroundColor: '#051F20',
            titleColor: '#8CB79B',
            bodyColor: '#ffffff',
            padding: 8,
            displayColors: false,
            callbacks: {
              title: () => '',
              label: (context) => `${context.parsed.y} un.`
            }
          }
        },
        scales: {
          x: { display: false },
          y: { display: false, min: Math.min(...this.spark) * 0.9, max: Math.max(...this.spark) * 1.1 }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    });
  }
}
