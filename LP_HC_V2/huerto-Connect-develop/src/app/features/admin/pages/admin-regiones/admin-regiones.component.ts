import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapVeracruzComponent } from '../../components/map-veracruz/map-veracruz.component';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { Region } from '../../models/region.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { RegionesService } from '../../services/regiones.service';

@Component({
  selector: 'app-admin-regiones',
  standalone: true,
  imports: [
    CommonModule,
    MapVeracruzComponent,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent
  ],
  templateUrl: './admin-regiones.component.html',
  styleUrls: ['./admin-regiones.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminRegionesComponent implements OnInit {
  private readonly toast = inject(ToastService);

  regiones: Region[] = [];
  selectedRegion: Region | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmVariant: 'danger' | 'warning' | 'info' = 'info';
  confirmIcon = 'flash-outline';
  confirmLabel = 'Confirmar';
  private pendingAction: (() => void) | null = null;

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
      key: 'usuarios',
      label: 'Usuarios',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    },
    {
      key: 'huertos',
      label: 'Huertos',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    },
    {
      key: 'detecciones',
      label: 'Detecciones',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    },
    {
      key: 'actividad',
      label: 'Actividad',
      type: 'select',
      options: ['Alta', 'Media', 'Baja'],
      required: true,
      validation: { kind: 'select' }
    }
  ];

  readonly rowIdentity = (region: Region): string => region.id;

  readonly columns: ColumnDef<Region>[] = [
    { key: 'nombre', header: 'Region', cell: (row) => row.nombre },
    { key: 'usuarios', header: 'Usuarios', cell: (row) => row.usuarios, align: 'center', width: '120px' },
    { key: 'huertos', header: 'Huertos', cell: (row) => row.huertos, align: 'center', width: '120px' },
    { key: 'detecciones', header: 'Detecciones', cell: (row) => row.detecciones, align: 'center', width: '120px' },
    { key: 'actividad', header: 'Actividad', cell: (row) => row.actividad, align: 'center', width: '110px' }
  ];

  readonly actions: ActionDef<Region>[] = [
    {
      id: 'crear',
      label: 'Crear',
      icon: 'add-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.crearRegion()
    },
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarRegion(selected)
    },
    {
      id: 'priorizar',
      label: 'Priorizar region',
      icon: 'flash-outline',
      variant: 'ghost',
      handler: (selected) => this.confirmarPriorizar(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarRegion(selected)
    }
  ];

  constructor(
    private readonly regionesService: RegionesService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.loadRegiones();
  }

  onSelectedChange(region: Region | null) {
    this.selectedRegion = region;
  }

  clearSelection() {
    this.selectedRegion = null;
  }

  private crearRegion() {
    this.isCreateMode = true;
    this.editData = {
      nombre: '',
      usuarios: 0,
      huertos: 0,
      detecciones: 0,
      actividad: 'Media',
    };
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  // ── Edit ──
  private editarRegion(selected: Region | null) {
    if (!selected) { return; }
    this.isCreateMode = false;
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as Region;
    const creating = this.isCreateMode;
    const request$ = creating
      ? this.regionesService.createRegion(updated)
      : this.regionesService.updateRegion(updated.id, updated);

    request$.subscribe({
      next: (saved) => {
        if (creating) {
          this.regiones = [saved, ...this.regiones];
        } else {
          this.regiones = this.regiones.map((item) =>
            item.id === saved.id ? { ...item, ...saved } : item
          );
        }
        this.editVisible = false;
        this.isCreateMode = false;
        this.editData = null;
        this.syncSelectedRegion();
        this.cdr.markForCheck();
        this.toast.success(
          creating
            ? `Región "${saved.nombre}" creada correctamente`
            : `Región "${saved.nombre}" actualizada correctamente`
        );
      },
      error: () => {
        this.toast.error(
          creating
            ? 'No se pudo crear la región en el servidor'
            : 'No se pudo actualizar la región en el servidor'
        );
      },
    });
  }

  onEditCancel() {
    this.editVisible = false;
    this.isCreateMode = false;
    this.editData = null;
  }

  // ── Priorizar ──
  private confirmarPriorizar(selected: Region | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Priorizar región';
    this.confirmMessage = `¿Desea priorizar la región "${selected.nombre}"? Esto establecerá su actividad como Alta.`;
    this.confirmVariant = 'warning';
    this.confirmIcon = 'flash-outline';
    this.confirmLabel = 'Priorizar';
    this.pendingAction = () => {
      this.regionesService.priorizarRegion(selected.id).subscribe({
        next: (saved) => {
          this.regiones = this.regiones.map((item) =>
            item.id === selected.id
              ? { ...item, nombre: saved.nombre, actividad: 'Alta' }
              : item
          );
          this.syncSelectedRegion();
          this.confirmVisible = false;
          this.cdr.markForCheck();
          this.toast.success(`Región "${selected.nombre}" priorizada correctamente`);
        },
        error: () => {
          this.confirmVisible = false;
          this.cdr.markForCheck();
          this.toast.error('No se pudo priorizar la región en el servidor');
        },
      });
    };
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  // ── Delete ──
  private eliminarRegion(selected: Region | null) {
    if (!selected) { return; }
    this.confirmTitle = 'Eliminar región';
    this.confirmMessage = `¿Está seguro de eliminar la región "${selected.nombre}"? Esta acción no se puede deshacer.`;
    this.confirmVariant = 'danger';
    this.confirmIcon = 'trash-outline';
    this.confirmLabel = 'Eliminar';
    this.pendingAction = () => {
      this.regionesService.deleteRegion(selected.id).subscribe((ok) => {
        this.confirmVisible = false;
        if (!ok) {
          this.cdr.markForCheck();
          this.toast.error('No se pudo eliminar la región en el servidor');
          return;
        }
        this.regiones = this.regiones.filter((item) => item.id !== selected.id);
        this.selectedRegion = null;
        this.cdr.markForCheck();
        this.toast.success(`Región "${selected.nombre}" eliminada correctamente`);
      });
    };
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirm() {
    const action = this.pendingAction;
    this.pendingAction = null;
    action?.();
  }

  onCancelConfirm() {
    this.pendingAction = null;
    this.confirmVisible = false;
  }

  private syncSelectedRegion() {
    if (!this.selectedRegion) { return; }
    this.selectedRegion = this.regiones.find((item) => item.id === this.selectedRegion?.id) ?? null;
  }

  private loadRegiones() {
    this.regionesService.getRegiones().subscribe((regiones) => {
      this.regiones = regiones;
      this.syncSelectedRegion();
      this.cdr.markForCheck();
    });
  }
}
