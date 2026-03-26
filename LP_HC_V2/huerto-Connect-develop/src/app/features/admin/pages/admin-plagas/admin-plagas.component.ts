import { ChangeDetectionStrategy, ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminDataTableComponent } from '../../components/admin-data-table/admin-data-table.component';
import { SelectedActionBarComponent } from '../../components/selected-action-bar/selected-action-bar.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { EditModalComponent, EditField } from '../../components/edit-modal/edit-modal.component';
import { ToastService } from '../../components/toast-notification/toast-notification.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { PlagaDeteccion } from '../../models/plaga-deteccion.model';
import { ActionDef, ColumnDef } from '../../models/table-def.model';
import { PlagasService } from '../../services/plagas.service';

@Component({
  selector: 'app-admin-plagas',
  standalone: true,
  imports: [
    CommonModule,
    AdminDataTableComponent,
    SelectedActionBarComponent,
    ConfirmDialogComponent,
    EditModalComponent,
    StatusBadgeComponent
  ],
  templateUrl: './admin-plagas.component.html',
  styleUrls: ['./admin-plagas.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminPlagasComponent implements OnInit {
  private readonly toast = inject(ToastService);
  readonly fallbackEvidenceImage = 'assets/images/huertooo.webp';
  private readonly pestImageByKeyword: Array<{ keywords: string[]; image: string }> = [
    {
      keywords: ['mosca blanca', 'whitefly'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Witte_vlieg_op_boerenkool.jpg/1280px-Witte_vlieg_op_boerenkool.jpg'
    },
    {
      keywords: ['pulgon', 'aphid'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Aphids_September_2008-1.jpg/1280px-Aphids_September_2008-1.jpg'
    },
    {
      keywords: ['arana roja', 'acaro', 'spider mite'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Tetranychus_urticae_%284883560779%29.jpg/1280px-Tetranychus_urticae_%284883560779%29.jpg'
    },
    {
      keywords: ['trips', 'thrips'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Thrips_tabaci%2C_Frankliniella_occidentalis.jpg'
    },
    {
      keywords: ['minador', 'leaf miner', 'liriomyza'],
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Liriomyza_huidobrensis_%28Blanchard%2C_1926%29_3384332183.jpg/1280px-Liriomyza_huidobrensis_%28Blanchard%2C_1926%29_3384332183.jpg'
    }
  ];

  detecciones: PlagaDeteccion[] = [];
  selectedDeteccion: PlagaDeteccion | null = null;

  // ── Confirm dialog state ──
  confirmVisible = false;
  confirmTitle = '';
  confirmMessage = '';
  private pendingAction: (() => void) | null = null;
  confirmVariant: 'danger' | 'warning' | 'info' = 'danger';
  confirmIcon = 'alert-circle-outline';
  confirmLabel = 'Confirmar';

  // ── Drawer state ──
  drawerVisible = false;
  drawerData: PlagaDeteccion | null = null;

  // ── Edit modal state ──
  editVisible = false;
  isCreateMode = false;
  editData: Record<string, unknown> | null = null;
  readonly editFields: EditField[] = [
    {
      key: 'imagenUrl',
      label: 'URL de imagen',
      type: 'text',
      validation: { kind: 'text', minLength: 0, maxLength: 500 }
    },
    {
      key: 'plaga',
      label: 'Plaga',
      type: 'text',
      required: true,
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'confianza',
      label: 'Confianza (%)',
      type: 'number',
      validation: { kind: 'number', min: 0, max: 100, maxDigits: 3 }
    },
    {
      key: 'cultivo',
      label: 'Cultivo',
      type: 'text',
      validation: { kind: 'text', minLength: 2, maxLength: 80 }
    },
    {
      key: 'ubicacion',
      label: 'Huerto ID',
      type: 'text',
      required: true,
      validation: { kind: 'text', minLength: 2, maxLength: 120 }
    },
    {
      key: 'severidad',
      label: 'Severidad',
      type: 'select',
      options: ['Baja', 'Media', 'Alta'],
      required: true,
      validation: { kind: 'select' }
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: ['Pendiente', 'Confirmada', 'Descartada'],
      required: true,
      validation: { kind: 'select' }
    }
  ];

  readonly rowIdentity = (deteccion: PlagaDeteccion): string => deteccion.id;

  readonly columns: ColumnDef<PlagaDeteccion>[] = [
    { key: 'imagen', header: 'Evidencia', isCustom: true, align: 'center', width: '90px' },
    { key: 'plaga', header: 'Plaga', cell: (row) => row.plaga },
    { key: 'confianza', header: 'Confianza', cell: (row) => `${row.confianza}%`, align: 'center', width: '100px' },
    { key: 'cultivo', header: 'Cultivo', cell: (row) => row.cultivo, align: 'center', width: '120px' },
    { key: 'ubicacion', header: 'Ubicacion', cell: (row) => row.ubicacion, width: '130px' },
    { key: 'severidad', header: 'Severidad', cell: (row) => row.severidad, align: 'center', width: '110px', isCustom: true },
    { key: 'estado', header: 'Estado', cell: (row) => row.estado, align: 'center', width: '130px', isCustom: true },
    { key: 'fecha', header: 'Fecha', cell: (row) => row.fecha, width: '140px' }
  ];

  readonly actions: ActionDef<PlagaDeteccion>[] = [
    {
      id: 'crear',
      label: 'Crear',
      icon: 'add-outline',
      variant: 'ghost',
      requiresSelection: false,
      handler: () => this.crearDeteccion()
    },
    {
      id: 'editar',
      label: 'Editar',
      icon: 'create-outline',
      variant: 'primary',
      handler: (selected) => this.editarDeteccion(selected)
    },
    {
      id: 'correcta',
      label: 'Marcar correcta',
      icon: 'checkmark-outline',
      variant: 'ghost',
      handler: (selected) => this.confirmarMarcar(selected, 'Confirmada')
    },
    {
      id: 'incorrecta',
      label: 'Marcar incorrecta',
      icon: 'close-outline',
      variant: 'danger',
      handler: (selected) => this.confirmarMarcar(selected, 'Descartada')
    }
  ];

  constructor(
    private readonly plagasService: PlagasService,
    private readonly cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.plagasService.getDetecciones().subscribe((detecciones) => {
      this.detecciones = detecciones.map((item) => this.withMatchedImage(item));
      this.syncSelectedDeteccion();
      this.cdr.markForCheck();
    });
  }

  onSelectedChange(deteccion: PlagaDeteccion | null) {
    this.selectedDeteccion = deteccion;
    if (deteccion) {
      this.openDrawer(deteccion);
    } else {
      this.closeDrawer();
    }
  }

  clearSelection() {
    this.selectedDeteccion = null;
  }

  private crearDeteccion() {
    this.isCreateMode = true;
    this.editData = {
      imagenUrl: '',
      plaga: '',
      confianza: 0,
      cultivo: '',
      ubicacion: '',
      fecha: '',
      severidad: 'Baja',
      estado: 'Pendiente',
    };
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  // ── Edit ──
  private editarDeteccion(selected: PlagaDeteccion | null) {
    if (!selected) { return; }
    this.isCreateMode = false;
    this.editData = { ...selected } as unknown as Record<string, unknown>;
    this.editVisible = true;
    this.cdr.markForCheck();
  }

  onEditSave(data: Record<string, unknown>) {
    const updated = data as unknown as PlagaDeteccion;
    const creating = this.isCreateMode;
    const request$ = creating
      ? this.plagasService.createDeteccion(updated)
      : this.plagasService.updateDeteccion(updated.id, updated);

    request$.subscribe({
      next: (saved) => {
        const withImage = this.withMatchedImage(saved);
        if (creating) {
          this.detecciones = [withImage, ...this.detecciones];
        } else {
          this.detecciones = this.detecciones.map((item) =>
            item.id === withImage.id ? { ...item, ...withImage } : item
          );
        }
        this.editVisible = false;
        this.isCreateMode = false;
        this.editData = null;
        this.syncSelectedDeteccion();
        this.cdr.markForCheck();
        this.toast.success(
          creating
            ? `Detección "${withImage.plaga}" creada correctamente`
            : `Detección "${withImage.plaga}" actualizada correctamente`
        );
      },
      error: () => {
        this.toast.error(
          creating
            ? 'No se pudo crear la detección en el servidor'
            : 'No se pudo actualizar la detección en el servidor'
        );
      },
    });
  }

  onEditCancel() {
    this.editVisible = false;
    this.isCreateMode = false;
    this.editData = null;
  }

  onImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackEvidenceImage)) { return; }
    image.src = this.fallbackEvidenceImage;
  }

  // ── Marcar con confirm ──
  private confirmarMarcar(selected: PlagaDeteccion | null, estado: PlagaDeteccion['estado']) {
    if (!selected) { return; }
    const isDescartar = estado === 'Descartada';
    this.confirmTitle = isDescartar ? 'Descartar detección' : 'Confirmar detección';
    this.confirmMessage = isDescartar
      ? `¿Está seguro de marcar la detección "${selected.plaga}" como incorrecta?`
      : `¿Confirmar que la detección "${selected.plaga}" es correcta?`;
    this.confirmVariant = isDescartar ? 'danger' : 'info';
    this.confirmIcon = isDescartar ? 'close-circle-outline' : 'checkmark-circle-outline';
    this.confirmLabel = isDescartar ? 'Descartar' : 'Confirmar';
    this.pendingAction = () => this.marcar(selected, estado);
    this.confirmVisible = true;
    this.cdr.markForCheck();
  }

  onConfirm() {
    if (this.pendingAction) {
      this.pendingAction();
    }
    this.pendingAction = null;
    this.confirmVisible = false;
    this.cdr.markForCheck();
  }

  onCancelConfirm() {
    this.pendingAction = null;
    this.confirmVisible = false;
  }

  private marcar(deteccion: PlagaDeteccion, estado: PlagaDeteccion['estado']) {
    this.plagasService.marcarDeteccion(deteccion.id, estado).subscribe(() => {
      this.detecciones = this.detecciones.map((item) =>
        item.id === deteccion.id ? { ...item, estado } : item
      );
      this.syncSelectedDeteccion();
      this.cdr.markForCheck();
      const label = estado === 'Confirmada' ? 'confirmada' : 'descartada';
      this.toast.success(`Detección "${deteccion.plaga}" marcada como ${label}`);
    });
  }

  // ── Drawer Actions ──
  openDrawer(selected: PlagaDeteccion | null, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (!selected) { return; }
    this.drawerData = selected;
    this.drawerVisible = true;
    this.zoomActive = false;
    this.cdr.markForCheck();
  }

  closeDrawer() {
    this.drawerVisible = false;
    this.drawerData = null;
    this.selectedDeteccion = null; // Unselect row when closing drawer
    this.zoomActive = false;
    this.cdr.markForCheck();
  }

  // ── Amazon Zoom ──
  zoomActive = false;
  lensX = 0;
  lensY = 0;
  lensSize = 180;
  bgPosX = 0;
  bgPosY = 0;

  onMouseMove(event: MouseEvent) {
    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();

    // Mouse position relative to container
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate lens position, offset by half lens size to center it on cursor
    let lx = x - this.lensSize / 2;
    let ly = y - this.lensSize / 2;

    // Constrain lens within image container
    if (lx < 0) lx = 0;
    if (ly < 0) ly = 0;
    if (lx > rect.width - this.lensSize) lx = rect.width - this.lensSize;
    if (ly > rect.height - this.lensSize) ly = rect.height - this.lensSize;

    this.lensX = lx;
    this.lensY = ly;

    // Calculate background position percentages
    // The ratio of lens position across the allowable travel space
    const ratioX = lx / (rect.width - this.lensSize);
    const ratioY = ly / (rect.height - this.lensSize);

    this.bgPosX = ratioX * 100;
    this.bgPosY = ratioY * 100;
    this.cdr.markForCheck();
  }

  drawerActionEditar() {
    this.editarDeteccion(this.drawerData);
  }

  drawerActionMarcar(estado: PlagaDeteccion['estado']) {
    this.confirmarMarcar(this.drawerData, estado);
  }

  private syncSelectedDeteccion() {
    if (!this.selectedDeteccion) { return; }
    this.selectedDeteccion =
      this.detecciones.find((item) => item.id === this.selectedDeteccion?.id) ?? null;
  }

  private withMatchedImage(item: PlagaDeteccion): PlagaDeteccion {
    const matchedImage = this.resolveImageByPlaga(item.plaga);
    return {
      ...item,
      imagenUrl: (matchedImage ?? item.imagenUrl) || this.fallbackEvidenceImage
    };
  }

  private resolveImageByPlaga(plaga: string): string | null {
    const normalized = this.normalizeText(plaga);
    const match = this.pestImageByKeyword.find((entry) =>
      entry.keywords.some((keyword) => normalized.includes(keyword))
    );
    return match?.image ?? null;
  }

  private normalizeText(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
