import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { EditField, EditModalComponent } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { ReportesService } from '../../services/reportes.service';
import { ReporteItem } from '../../mock/reportes.mock';

@Component({
  selector: 'app-admin-reportes',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent, StatusBadgeComponent, EditModalComponent],
  templateUrl: './admin-reportes.component.html',
  styleUrls: ['./admin-reportes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminReportesComponent implements OnInit {
  private readonly toast = inject(ToastService);

  reportes: ReporteItem[] = [];
  selectedReporte: ReporteItem | null = null;
  editVisible = false;
  isCreateMode = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      validation: { kind: 'text', minLength: 3, maxLength: 200 }
    },
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: ['Analitica', 'Sanidad', 'Conversacional', 'General'],
      validation: { kind: 'select' }
    }
  ];
  readonly rowIdentity = (reporte: ReporteItem): string => reporte.id;
  readonly columns: ColumnDef<ReporteItem>[] = [
    { key: 'nombre', header: 'Reporte', cell: (row) => row.nombre },
    { key: 'tipo', header: 'Tipo', cell: (row) => row.tipo, width: '140px' },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '120px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '130px', isCustom: true }
  ];
  readonly actions: ActionDef<ReporteItem>[] = [
    {
      id: 'crear',
      label: 'Crear',
      icon: 'add-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.crear()
    },
    {
      id: 'descargar',
      label: 'Descargar',
      icon: 'download-outline',
      variant: 'primary',
      handler: (selected) => this.descargar(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminar(selected)
    }
  ];

  constructor(
    private readonly reportesService: ReportesService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reportesService.getReportes().subscribe((reportes) => {
      this.reportes = reportes;
      this.syncSelectedReporte();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(reporte: ReporteItem | null) {
    this.selectedReporte = reporte;
  }

  clearSelection() {
    this.selectedReporte = null;
  }

  private crear() {
    this.isCreateMode = true;
    this.editData = {
      nombre: '',
      tipo: 'General'
    };
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const creating = this.isCreateMode;
    if (!creating) {
      this.editVisible = false;
      this.editData = null;
      return;
    }
    this.reportesService.createReporte(data as Partial<ReporteItem>).subscribe({
      next: (created) => {
        this.reportes = [created, ...this.reportes];
        this.editVisible = false;
        this.isCreateMode = false;
        this.editData = null;
        this.cdr.markForCheck();
        this.toast.success(`Reporte "${created.nombre}" creado correctamente`);
      },
      error: () => {
        this.toast.error('No se pudo crear el reporte en el servidor');
      },
    });
  }

  onEditCancel() {
    this.editVisible = false;
    this.isCreateMode = false;
    this.editData = null;
  }

  private descargar(selected: ReporteItem | null) {
    if (!selected) {
      return;
    }
    // Placeholder para descarga
  }

  private eliminar(selected: ReporteItem | null) {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm(`Eliminar reporte ${selected.nombre}?`);
    if (!confirmed) {
      return;
    }
    this.reportesService.deleteReporte(selected.id).subscribe((ok) => {
      if (!ok) {
        this.toast.error('No se pudo eliminar el reporte en el servidor');
        return;
      }
      this.reportes = this.reportes.filter((item) => item.id !== selected.id);
      this.selectedReporte = null;
      this.cdr.markForCheck();
      this.toast.success(`Reporte "${selected.nombre}" eliminado correctamente`);
    });
  }

  private syncSelectedReporte() {
    if (!this.selectedReporte) {
      return;
    }
    this.selectedReporte = this.reportes.find((item) => item.id === this.selectedReporte?.id) ?? null;
  }
}
