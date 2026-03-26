import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnDef } from '../../models/table-def.model';

@Component({
  selector: 'app-admin-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-data-table.component.html',
  styleUrls: ['./admin-data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDataTableComponent<T extends object> {
  @Input() rows: T[] = [];
  @Input() columns: ColumnDef<T>[] = [];
  @Input() selected: T | null = null;
  @Input() rowIdentity: ((row: T) => string | number) | null = null;
  @Input() emptyMessage = 'No hay registros para mostrar.';
  @Output() selectedChange = new EventEmitter<T | null>();

  @ContentChild('customCellTemplate') customCellTemplate?: TemplateRef<{ $implicit: T, column: ColumnDef<T> }>;

  selectRow(row: T): void {
    this.selectedChange.emit(row);
  }

  onRowKeydown(event: KeyboardEvent, row: T): void {
    const key = event.key;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.selectRow(row);
    }
  }

  isSelected(row: T): boolean {
    if (!this.selected) {
      return false;
    }

    if (!this.rowIdentity) {
      return this.selected === row;
    }

    return this.rowIdentity(this.selected) === this.rowIdentity(row);
  }

  trackByRow = (_: number, row: T): string | number => {
    if (this.rowIdentity) {
      return this.rowIdentity(row);
    }
    return _;
  };

  trackByColumn = (_: number, column: ColumnDef<T>): string => column.key;
}
