import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiltersBarComponent, FilterField } from '../../components/filters-bar/filters-bar.component';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { Usuario } from '../../models/usuario.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { UsuariosService } from '../../services/usuarios.service';

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FiltersBarComponent,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent,
    StatusBadgeComponent
  ],
  templateUrl: './admin-usuarios.component.html',
  styleUrls: ['./admin-usuarios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsuariosComponent implements OnInit {
  private readonly toast = inject(ToastService);

  usuarios: Usuario[] = [];
  selectedUsuario: Usuario | null = null;
  search = '';

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
      validation: { kind: 'name', minLength: 2, maxLength: 50 }
    },
    {
      key: 'correo',
      label: 'Correo',
      type: 'email',
      required: true,
      validation: { kind: 'email' }
    },
    {
      key: 'password',
      label: 'Contraseña temporal',
      type: 'text',
      placeholder: 'Mínimo 6 caracteres (solo para crear)',
      validation: { kind: 'text', minLength: 6, maxLength: 128, required: false }
    },
    {
      key: 'region',
      label: 'Región',
      type: 'text',
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'rol',
      label: 'Rol',
      type: 'select',
      options: ['Admin', 'Productor', 'Tecnico'],
      required: true,
      validation: { kind: 'select' }
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ['Activo', 'Inactivo', 'Suspendido'],
      required: true,
      validation: { kind: 'select' }
    },
    {
      key: 'huertos',
      label: 'Huertos',
      type: 'number',
      validation: { kind: 'number', integer: true, min: 0, max: 10000, maxDigits: 5 }
    }
  ];

  fields: FilterField[] = [
    { id: 'region', label: 'Region', value: '', options: [] },
    { id: 'estado', label: 'Estado', value: '', options: ['Activo', 'Inactivo', 'Suspendido'] }
  ];

  readonly rowIdentity = (usuario: Usuario): string => usuario.id;

  readonly columns: ColumnDef<Usuario>[] = [
    { key: 'nombre', header: 'Nombre', cell: (row) => row.nombre },
    { key: 'correo', header: 'Correo', cell: (row) => row.correo },
    { key: 'region', header: 'Region', cell: (row) => row.region },
    { key: 'rol', header: 'Rol', cell: (row) => row.rol, align: 'center', width: '110px' },
    { key: 'huertos', header: 'Huertos', cell: (row) => row.huertos, align: 'center', width: '90px' },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '120px', isCustom: true },
    { key: 'ultimaActividad', header: 'Ultima actividad', cell: (row) => row.ultimaActividad, width: '130px' }
  ];

  readonly actions: ActionDef<Usuario>[] = [
    {
      id: 'crear',
      label: 'Crear',
      icon: 'add-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.crearUsuario()
    },
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarUsuario(selected)
    },
    {
      id: 'eliminar',
      label: 'Eliminar',
      icon: 'trash-outline',
      variant: 'danger',
      handler: (selected) => this.eliminarUsuario(selected)
    }
  ];

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reload();
  }

  onSearch(value: string) {
    this.search = value;
    this.reload();
  }

  onFieldsChange(fields: FilterField[]) {
    this.fields = fields;
    this.reload();
  }

  onSelectedChange(usuario: Usuario | null) {
    this.selectedUsuario = usuario;
  }

  clearSelection() {
    this.selectedUsuario = null;
  }

  private crearUsuario() {
    this.isCreateMode = true;
    this.editData = {
      nombre: '',
      correo: '',
      password: '',
      region: '',
      rol: 'Productor',
      estado: 'Activo',
      huertos: 0,
      ultimaActividad: '',
    };
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  // ── Edit ──
  private editarUsuario(selected: Usuario | null) {
    if (!selected) { return; }
    this.isCreateMode = false;
    this.editData = { ...selected, password: '' } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const creating = this.isCreateMode;
    const rawPassword = String(data['password'] ?? '');
    if (creating && rawPassword.trim().length < 6) {
      this.toast.error('La contraseña temporal debe tener al menos 6 caracteres');
      return;
    }
    const updated = data as unknown as Usuario;
    const request$ = creating
      ? this.usuariosService.createUsuario(data)
      : this.usuariosService.updateUsuario(updated.id, updated);

    request$.subscribe({
      next: (saved) => {
        if (creating) {
          this.usuarios = [saved, ...this.usuarios];
        } else {
          this.usuarios = this.usuarios.map((item) =>
            item.id === saved.id ? { ...item, ...saved } : item
          );
        }
        this.editVisible = false;
        this.isCreateMode = false;
        this.editData = null;
        this.syncSelectedUsuario();
        this.cdr.markForCheck();
        this.toast.success(
          creating
            ? `Usuario "${saved.nombre}" creado correctamente`
            : `Usuario "${saved.nombre}" actualizado correctamente`
        );
      },
      error: () => {
        this.toast.error(
          creating
            ? 'No se pudo crear el usuario en el servidor'
            : 'No se pudo actualizar el usuario en el servidor'
        );
      },
    });
  }

  onEditCancel() {
    this.editVisible = false;
    this.isCreateMode = false;
    this.editData = null;
  }

  // ── Delete ──
  private eliminarUsuario(selected: Usuario | null) {
    if (!selected) { return; }
    this.pendingDeleteId = selected.id;
    this.confirmTitle = 'Eliminar usuario';
    this.confirmMessage = `¿Está seguro de eliminar al usuario "${selected.nombre}"? Esta acción no se puede deshacer.`;
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirmDelete() {
    if (!this.pendingDeleteId) { return; }
    const deleteId = this.pendingDeleteId;
    const nombre = this.usuarios.find((u) => u.id === deleteId)?.nombre ?? '';
    this.usuariosService.deleteUsuario(deleteId).subscribe((ok) => {
      this.confirmVisible = false;
      if (!ok) {
        this.cdr.markForCheck();
        this.toast.error('No se pudo eliminar el usuario en el servidor');
        return;
      }
      this.usuarios = this.usuarios.filter((item) => item.id !== deleteId);
      this.selectedUsuario = null;
      this.pendingDeleteId = null;
      this.cdr.markForCheck();
      this.toast.success(`Usuario "${nombre}" eliminado correctamente`);
    });
  }

  onCancelDelete() {
    this.pendingDeleteId = null;
    this.confirmVisible = false;
  }

  private reload() {
    const region = this.fields.find((item) => item.id === 'region')?.value ?? '';
    const estado = this.fields.find((item) => item.id === 'estado')?.value as Usuario['estado'] | '';

    this.usuariosService
      .getUsuarios({ busqueda: this.search, region, estado })
      .subscribe((usuarios) => {
        this.usuarios = usuarios;
        this.syncSelectedUsuario();
        const regionField = this.fields.find((item) => item.id === 'region');
        if (regionField && regionField.options.length === 0) {
          regionField.options = [...new Set(usuarios.map((item) => item.region))];
        }
        this.cdr.markForCheck();
      });
  }

  private syncSelectedUsuario() {
    if (!this.selectedUsuario) { return; }
    const selected = this.usuarios.find((item) => item.id === this.selectedUsuario?.id) ?? null;
    this.selectedUsuario = selected;
  }
}
