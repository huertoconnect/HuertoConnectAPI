import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Plantio } from '../models/plantio.model';
import { RegionesService } from './regiones.service';

@Injectable({ providedIn: 'root' })
export class PlantiosService {
  private readonly regionesService = inject(RegionesService);

  getPlantios(): Observable<Plantio[]> {
    return this.regionesService.getPlantiosVeracruz();
  }
}
