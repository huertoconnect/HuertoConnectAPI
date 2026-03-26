import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { Plantio } from '../../models/plantio.model';
import { PlantiosService } from '../../services/plantios.service';

@Component({
  selector: 'app-map-veracruz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-veracruz.component.html',
  styleUrls: ['./map-veracruz.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapVeracruzComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  plantios: Plantio[] = [];
  filteredPlantios: Plantio[] = [];

  selectedCultivo = '';
  selectedMunicipio = '';
  selectedSeveridad = '';

  cultivos: string[] = [];
  municipios: string[] = [];
  severidades: string[] = ['Baja', 'Media', 'Alta'];

  private map: L.Map | null = null;
  private markersLayer = L.layerGroup();
  private subscription = new Subscription();

  constructor(
    private readonly plantiosService: PlantiosService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const sub = this.plantiosService.getPlantios().subscribe((data) => {
      this.plantios = data;
      this.cultivos = [...new Set(data.map((item) => item.cultivo))].sort();
      this.municipios = [...new Set(data.map((item) => item.municipio))].sort();
      this.applyFilters();
      this.cdr.markForCheck();
    });

    this.subscription.add(sub);
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  applyFilters() {
    this.filteredPlantios = this.plantios.filter((item) => {
      const matchCultivo = !this.selectedCultivo || item.cultivo === this.selectedCultivo;
      const matchMunicipio = !this.selectedMunicipio || item.municipio === this.selectedMunicipio;
      const matchSeveridad = !this.selectedSeveridad || item.severidad === this.selectedSeveridad;
      return matchCultivo && matchMunicipio && matchSeveridad;
    });

    this.renderMarkers();
  }

  trackByPlantio(_: number, plantio: Plantio): string {
    return plantio.id;
  }

  private initMap() {
    if (this.map) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      zoomControl: true,
      attributionControl: false
    }).setView([19.1738, -96.1342], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 5
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    setTimeout(() => this.map?.invalidateSize(), 0);
    this.renderMarkers();
  }

  private renderMarkers() {
    this.markersLayer.clearLayers();
    if (!this.map || this.filteredPlantios.length === 0) {
      return;
    }

    for (const plantio of this.filteredPlantios) {
      const marker = L.circleMarker([plantio.lat, plantio.lng], {
        radius: 7,
        color: this.colorBySeverity(plantio.severidad),
        weight: 2,
        fillColor: this.colorBySeverity(plantio.severidad),
        fillOpacity: 0.45
      });

      marker.bindPopup(`
        <strong>${plantio.nombre}</strong><br/>
        Cultivo: ${plantio.cultivo}<br/>
        Municipio: ${plantio.municipio}<br/>
        Salud: ${plantio.salud}%<br/>
        Alertas: ${plantio.alertas}
      `);

      marker.addTo(this.markersLayer);
    }
  }

  private colorBySeverity(level: Plantio['severidad']): string {
    if (level === 'Alta') {
      return '#ef4444'; // SaaS danger
    }
    if (level === 'Media') {
      return '#eab308'; // SaaS warning
    }
    return '#235347'; // SaaS Primary Deep
  }
}
