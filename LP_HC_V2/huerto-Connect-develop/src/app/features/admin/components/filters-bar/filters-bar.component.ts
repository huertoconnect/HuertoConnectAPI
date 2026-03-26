import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { sanitizePlainText } from '../../../../shared/validators';

export interface FilterField {
  id: string;
  label: string;
  value: string;
  options: string[];
}

@Component({
  selector: 'app-filters-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filters-bar.component.html',
  styleUrls: ['./filters-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FiltersBarComponent {
  @Input() searchPlaceholder = 'Buscar...';
  @Input() search = '';
  @Input() fields: FilterField[] = [];
  @Output() searchChange = new EventEmitter<string>();
  @Output() fieldsChange = new EventEmitter<FilterField[]>();

  onSearch(value: string) {
    const sanitizedSearch = sanitizePlainText(value, {
      trim: false,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 120
    });
    this.searchChange.emit(sanitizedSearch);
  }

  onFieldChange(id: string, value: string) {
    const sanitizedValue = sanitizePlainText(value, {
      trim: true,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 80
    });
    const updated = this.fields.map((field) => (field.id === id ? { ...field, value: sanitizedValue } : field));
    this.fieldsChange.emit(updated);
  }
}
