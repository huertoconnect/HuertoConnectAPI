import {
    CUSTOM_ELEMENTS_SCHEMA,
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FieldValidationConfig, validateFieldValue } from '../../../../shared/validators';

export interface EditField {
    key: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
    options?: string[];
    required?: boolean;
    placeholder?: string;
    validation?: FieldValidationConfig;
}

@Component({
    selector: 'app-edit-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './edit-modal.component.html',
    styleUrls: ['./edit-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditModalComponent implements OnChanges {
    @Input() visible = false;
    @Input() title = 'Editar registro';
    @Input() fields: EditField[] = [];
    @Input() set data(value: Record<string, unknown> | null) {
        this.formData = value ? { ...value } : {};
        this.formSubmitted = false;
        this.initializeValidationState();
    }
    @Output() save = new EventEmitter<Record<string, unknown>>();
    @Output() cancel = new EventEmitter<void>();

    formData: Record<string, unknown> = {};
    fieldTouched: Record<string, boolean> = {};
    fieldErrors: Record<string, string[]> = {};
    formSubmitted = false;

    ngOnChanges() {
        this.initializeValidationState();
    }

    onOverlayClick(event: MouseEvent) {
        if ((event.target as HTMLElement).classList.contains('overlay')) {
            this.cancel.emit();
        }
    }

    onFieldChange(field: EditField, value: unknown) {
        const result = this.validateField(field, value);
        this.formData[field.key] = result.sanitizedValue;
    }

    onFieldBlur(field: EditField) {
        this.fieldTouched[field.key] = true;
    }

    onSave() {
        this.formSubmitted = true;
        this.validateAllFields();
        if (!this.isFormValid()) {
            return;
        }
        this.save.emit({ ...this.formData });
    }

    getFieldError(field: EditField): string | null {
        const showError = this.formSubmitted || this.fieldTouched[field.key];
        if (!showError) {
            return null;
        }

        return this.fieldErrors[field.key]?.[0] ?? null;
    }

    isFieldInvalid(field: EditField): boolean {
        const showError = this.formSubmitted || this.fieldTouched[field.key];
        return showError && (this.fieldErrors[field.key]?.length ?? 0) > 0;
    }

    isFieldValid(field: EditField): boolean {
        if (this.isFieldInvalid(field)) {
            return false;
        }

        const value = this.formData[field.key];
        const hasValue = String(value ?? '').trim().length > 0 || typeof value === 'boolean';
        return (this.fieldTouched[field.key] || this.formSubmitted) && hasValue;
    }

    isFormValid(): boolean {
        return this.fields.every((field) => this.computeValidation(field, this.formData[field.key]).errors.length === 0);
    }

    trackByKey(_: number, field: EditField): string {
        return field.key;
    }

    private initializeValidationState() {
        const nextTouched: Record<string, boolean> = {};
        const nextErrors: Record<string, string[]> = {};

        for (const field of this.fields) {
            nextTouched[field.key] = this.fieldTouched[field.key] ?? false;
            nextErrors[field.key] = [];
        }

        this.fieldTouched = nextTouched;
        this.fieldErrors = nextErrors;
        this.validateAllFields();
    }

    private validateAllFields() {
        for (const field of this.fields) {
            this.validateField(field, this.formData[field.key]);
        }
    }

    private validateField(field: EditField, rawValue: unknown) {
        const result = this.computeValidation(field, rawValue);
        this.fieldErrors[field.key] = result.errors;
        return result;
    }

    private computeValidation(field: EditField, rawValue: unknown) {
        return validateFieldValue(
            rawValue,
            {
                ...field.validation,
                label: field.validation?.label ?? field.label,
                required: field.required ?? field.validation?.required ?? false
            },
            field.type
        );
    }
}
