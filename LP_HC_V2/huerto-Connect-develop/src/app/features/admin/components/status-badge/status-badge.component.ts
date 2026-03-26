import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatusBadgeComponent {
  @Input() status = '';

  get toneClass(): string {
    const value = this.status.toLowerCase();
    if (['activo', 'optimo', 'conectado', 'seguro', 'resuelta', 'confirmada', 'generado', 'baja'].includes(value)) {
      return 'ok';
    }
    if (['advertencia', 'atencion', 'degradado', 'en progreso', 'en proceso', 'pendiente', 'media'].includes(value)) {
      return 'warn';
    }
    if (['critico', 'suspendido', 'desconectado', 'descartada', 'alta'].includes(value)) {
      return 'bad';
    }
    if (['inactivo'].includes(value)) {
      return 'neutral';
    }
    return 'neutral';
  }
}
