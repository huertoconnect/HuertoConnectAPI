import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { HuertosService } from '../../services/huertos.service';
import { Huerto } from '../../models/huerto.model';

@Component({
  selector: 'app-admin-huertos',
  standalone: true,
  imports: [
    CommonModule,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent,
    StatusBadgeComponent
  ],
  templateUrl: './admin-huertos.component.html',
  styleUrls: ['./admin-huertos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminHuertosComponent implements OnInit {
  private readonly toast = inject(ToastService);

  huertos: Huerto[] = [];
  selectedHuerto: Huerto | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingDeleteId: string | null = null;

  // ── Edit modal state ──
  editVisible = false;
  isCreateMode = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      type: 'text',
      required: true,
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'usuario',
      label: 'Usuario',
      type: 'text',
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'municipio',
      label: 'Municipio',
      type: 'text',
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'region',
      label: 'Región',
      type: 'text',
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'cultivosActivos',
      label: 'Cultivos activos',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ['Optimo', 'Atencion', 'Critico'],
      required: true,
      validation: { kind: 'select' }
    },
    {
      key: 'salud',
      label: 'Salud (%)',
      type: 'number',
      validation: { kind: 'number', min: 0, max: 100, maxDigits: 3 }
    },
    {
      key: 'alertas',
      label: 'Alertas',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    }
  ];

  readonly rowIdentity = (huerto: Huerto): string => huerto.id;

  readonly columns: ColumnDef<Huerto>[] = [
    { key: 'nombre', header: 'Huerto', cell: (row) => row.nombre },
    { key: 'usuario', header: 'Usuario', cell: (row) => row.usuario },
    { key: 'municipio', header: 'Municipio', cell: (row) => row.municipio, width: '120px' },
    { key: 'cultivosActivos', header: 'Cultivos', cell: (row) => row.cultivosActivos, align: 'center', width: '90px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '120px', isCustom: true },
    { key: 'salud', header: 'Salud', cell: (row) => `${row.salud}%`, align: 'center', width: '90px' },
    { key: 'alertas', header: 'Alertas', cell: (row) => row.alertas, align: 'center', width: '90px' }
  ];

  readonly actions: ActionDef<Huerto>[] = [
    {
      id: 'crear',
      label: 'Crear',
      icon: 'add-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.crearHuerto()
    },
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarHuerto(selected)
    },
    {
      id: 'revision',
      label: 'Marcar revision',
      icon: 'flag-outline',
      variant: 'ghost',
      handler: (selected) => this.marcarRevision(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarHuerto(selected)
    }
  ];

  constructor(
    private readonly huertosService: HuertosService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadHuertos();
  }

  onSelectedChange(huerto: Huerto | null) {
    this.selectedHuerto = huerto;
  }

  clearSelection() {
    this.selectedHuerto = null;
  }

  private crearHuerto() {
    this.isCreateMode = true;
    this.editData = {
      nombre: '',
      usuario: '',
      municipio: '',
      region: '',
      cultivosActivos: 0,
      estado: 'Optimo',
      salud: 100,
      alertas: 0,
    };
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  // ── Edit ──
  private editarHuerto(selected: Huerto | null) {
    if (!selected) { return; }
    this.isCreateMode = false;
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as Huerto;
    const creating = this.isCreateMode;
    const request$ = creating
      ? this.huertosService.createHuerto(updated)
      : this.huertosService.updateHuerto(updated.id, updated);

    request$.subscribe({
      next: (saved) => {
        if (creating) {
          this.huertos = [saved, ...this.huertos];
        } else {
          this.huertos = this.huertos.map((item) =>
            item.id === saved.id ? { ...item, ...saved } : item
          );
        }
        this.editVisible = false;
        this.isCreateMode = false;
        this.editData = null;
        this.syncSelectedHuerto();
        this.cdr.markForCheck();
        this.toast.success(
          creating
            ? `Huerto "${saved.nombre}" creado correctamente`
            : `Huerto "${saved.nombre}" actualizado correctamente`
        );
      },
      error: () => {
        this.toast.error(
          creating
            ? 'No se pudo crear el huerto en el servidor'
            : 'No se pudo actualizar el huerto en el servidor'
        );
      },
    });
  }

  onEditCancel() {
    this.editVisible = false;
    this.isCreateMode = false;
    this.editData = null;
  }

  // ── Revision ──
  private marcarRevision(selected: Huerto | null) {
    if (!selected) { return; }
    this.huertosService.markHuertoRevision(selected.id).subscribe({
      next: (saved) => {
        this.huertos = this.huertos.map((item) =>
          item.id === selected.id ? { ...item, ...saved } : item
        );
        this.syncSelectedHuerto();
        this.cdr.markForCheck();
        this.toast.warning(`Huerto "${selected.nombre}" marcado para revisión`);
      },
      error: () => {
        this.toast.error('No se pudo marcar revisión en el servidor');
      },
    });
  }

  // ── Delete ──
  private eliminarHuerto(selected: Huerto | null) {
    if (!selected) { return; }
    this.pendingDeleteId = selected.id;
    this.confirmTitle = 'Eliminar huerto';
    this.confirmMessage = `¿Está seguro de eliminar el huerto "${selected.nombre}"? Esta acción no se puede deshacer.`;
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirmDelete() {
    if (!this.pendingDeleteId) { return; }
    const deleteId = this.pendingDeleteId;
    const nombre = this.huertos.find((h) => h.id === deleteId)?.nombre ?? '';
    this.huertosService.deleteHuerto(deleteId).subscribe((ok) => {
      if (!ok) {
        this.toast.error('No se pudo eliminar el huerto en el servidor');
        return;
      }
      this.huertos = this.huertos.filter((item) => item.id !== deleteId);
      this.selectedHuerto = null;
      this.pendingDeleteId = null;
      this.confirmVisible = false;
      this.cdr.markForCheck();
      this.toast.success(`Huerto "${nombre}" eliminado correctamente`);
    });
  }

  onCancelDelete() {
    this.pendingDeleteId = null;
    this.confirmVisible = false;
  }

  private syncSelectedHuerto() {
    if (!this.selectedHuerto) { return; }
    this.selectedHuerto = this.huertos.find((item) => item.id === this.selectedHuerto?.id) ?? null;
  }

  private loadHuertos() {
    this.huertosService.getHuertos().subscribe((huertos) => {
      this.huertos = huertos;
      this.syncSelectedHuerto();
      this.cdr.markForCheck();
    });
  }
}
