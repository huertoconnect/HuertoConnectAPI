import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditoriaLog } from '../../models/auditoria-log.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { AuditoriaService } from '../../services/auditoria.service';

@Component({
  selector: 'app-admin-auditoria',
  standalone: true,
  imports: [CommonModule, AdminDataTableComponent, SelectedActionBarComponent],
  templateUrl: './admin-auditoria.component.html',
  styleUrls: ['./admin-auditoria.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminAuditoriaComponent implements OnInit {
  logs: AuditoriaLog[] = [];
  selectedLog: AuditoriaLog | null = null;
  readonly rowIdentity = (log: AuditoriaLog): string => log.id;
  readonly columns: ColumnDef<AuditoriaLog>[] = [
    { key: 'actor', header: 'Actor', cell: (row) => row.actor },
    { key: 'accion', header: 'Accion', cell: (row) => row.accion },
    { key: 'modulo', header: 'Modulo', cell: (row) => row.modulo, align: 'center', width: '120px' },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '150px' },
    { key: 'ip', header: 'IP', cell: (row) => row.ip, align: 'center', width: '120px' }
  ];
  readonly actions: ActionDef<AuditoriaLog>[] = [
    {
      id: 'detalle',
      label: 'Ver detalle',
      icon: 'eye-outline',
      variant: 'primary',
      handler: (selected) => this.verDetalle(selected)
    },
    {
      id: 'exportar',
      label: 'Exportar CSV',
      icon: 'download-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.exportarCsv()
    }
  ];

  constructor(
    private readonly auditoriaService: AuditoriaService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.auditoriaService.getLogs().subscribe((logs) => {
      this.logs = logs;
      this.syncSelectedLog();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(log: AuditoriaLog | null) {
    this.selectedLog = log;
  }

  clearSelection() {
    this.selectedLog = null;
  }

  private verDetalle(selected: AuditoriaLog | null) {
    if (!selected) {
      return;
    }
    // Placeholder para ver detalle
  }

  private exportarCsv() {
    // Placeholder para exportar CSV
  }

  private syncSelectedLog() {
    if (!this.selectedLog) {
      return;
    }
    this.selectedLog = this.logs.find((item) => item.id === this.selectedLog?.id) ?? null;
  }
}
