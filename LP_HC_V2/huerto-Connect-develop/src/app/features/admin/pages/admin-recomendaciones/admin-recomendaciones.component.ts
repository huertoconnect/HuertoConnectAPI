import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RecomendacionItem {
  titulo: string;
  region: string;
  cultivo: string;
  estado: string;
}

@Component({
  selector: 'app-admin-recomendaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-recomendaciones.component.html',
  styleUrls: ['./admin-recomendaciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRecomendacionesComponent {
  recomendaciones: RecomendacionItem[] = [
    { titulo: 'Ajuste de riego por humedad', region: 'Veracruz Puerto', cultivo: 'Tomate', estado: 'Activa' },
    { titulo: 'Calendario de poda de invierno', region: 'Xalapa', cultivo: 'Fresa', estado: 'Activa' },
    { titulo: 'Protocolo anti-hongos foliares', region: 'Cordoba', cultivo: 'Lechuga', estado: 'Revision' }
  ];
}
