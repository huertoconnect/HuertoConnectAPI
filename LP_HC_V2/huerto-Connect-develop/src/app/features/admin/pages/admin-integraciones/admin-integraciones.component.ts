import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IntegracionItem } from '../../mock/reportes.mock';
import { ReportesService } from '../../services/reportes.service';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActionDef, ColumnDef } from '../../models/table-def.model';

@Component({
  selector: 'app-admin-integraciones',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent, StatusBadgeComponent],
  templateUrl: './admin-integraciones.component.html',
  styleUrls: ['./admin-integraciones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminIntegracionesComponent implements OnInit {
  integraciones: IntegracionItem[] = [];
  selectedIntegracion: IntegracionItem | null = null;
  readonly rowIdentity = (item: IntegracionItem): string => item.nombre;
  readonly columns: ColumnDef<IntegracionItem>[] = [
    { key: 'nombre', header: 'Integracion', cell: (row) => row.nombre },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '130px', isCustom: true },
    { key: 'ultimaRevision', header: 'Ultima revision', cell: (row) => row.ultimaRevision, width: '160px' }
  ];
  readonly actions: ActionDef<IntegracionItem>[] = [
    {
      id: 'configurar',
      label: 'Configurar',
      icon: 'build-outline',
      variant: 'primary',
      handler: (selected) => this.configurar(selected)
    },
    {
      id: 'toggle',
      label: 'Habilitar / Deshabilitar',
      icon: 'power-outline',
      variant: 'ghost',
      handler: (selected) => this.toggleEstado(selected)
    }
  ];

  constructor(
    private readonly reportesService: ReportesService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reportesService.getIntegraciones().subscribe((integraciones) => {
      this.integraciones = integraciones;
      this.syncSelectedIntegracion();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(integracion: IntegracionItem | null) {
    this.selectedIntegracion = integracion;
  }

  clearSelection() {
    this.selectedIntegracion = null;
  }

  private configurar(selected: IntegracionItem | null) {
    if (!selected) {
      return;
    }
    // Placeholder para configurar
  }

  private toggleEstado(selected: IntegracionItem | null) {
    if (!selected) {
      return;
    }
    this.integraciones = this.integraciones.map((item) => {
      if (item.nombre !== selected.nombre) {
        return item;
      }
      const estado =
        item.estado === 'Conectado' ? 'Desconectado' : 'Conectado';
      return { ...item, estado };
    });
    this.syncSelectedIntegracion();
    this.cdr.markForCheck();
  }

  private syncSelectedIntegracion() {
    if (!this.selectedIntegracion) {
      return;
    }
    this.selectedIntegracion =
      this.integraciones.find((item) => item.nombre === this.selectedIntegracion?.nombre) ?? null;
  }
}
