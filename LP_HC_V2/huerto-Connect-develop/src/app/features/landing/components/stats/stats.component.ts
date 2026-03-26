import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stats.component.html',
    styleUrls: ['./stats.component.scss']
})
export class StatsComponent {
    stats = [
        { value: '+40%', label: 'Producción', sub: 'Incremento promedio' },
        { value: '-60%', label: 'Agua', sub: 'Reducción en consumo' },
        { value: '80%', label: 'Menos Químicos', sub: 'Disminución de uso' },
        { value: '$', label: 'ROI en 18 meses', sub: 'Recuperación garantizada', icon: 'dollar-sign' },
        { value: '70%', label: 'Menos Tiempo', sub: 'Automatización de tareas' },
        { value: '95%', label: 'Prevención', sub: 'Detección temprana' }
    ];
}
