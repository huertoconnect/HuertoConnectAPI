import {
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionDef } from '../../models/table-def.model';

@Component({
  selector: 'app-selected-action-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selected-action-bar.component.html',
  styleUrls: ['./selected-action-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SelectedActionBarComponent<T extends object> {
  @Input() selected: T | null = null;
  @Input() title = 'Registro seleccionado';
  @Input() actions: ActionDef<T>[] = [];
  @Input() summaryTemplate: TemplateRef<unknown> | null = null;
  @Output() clearSelection = new EventEmitter<void>();

  run(action: ActionDef<T>): void {
    if (this.isDisabled(action)) {
      return;
    }
    action.handler(this.selected);
  }

  isDisabled(action: ActionDef<T>): boolean {
    const requiresSelection = action.requiresSelection ?? true;
    return requiresSelection && !this.selected;
  }

  trackByAction = (_: number, action: ActionDef<T>): string => action.id;
}
