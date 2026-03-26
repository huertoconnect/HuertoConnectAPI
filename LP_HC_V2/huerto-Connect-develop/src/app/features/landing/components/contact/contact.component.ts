import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    AbstractControl,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    ValidationErrors,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { DataService } from '../../../../core/services/data.service';
import { ScrollRevealDirective } from '../../../../shared/directives/scroll-reveal.directive';
import {
    prepareTextForSubmission,
    sanitizeEmail,
    sanitizePlainText,
    validateEmailValue,
    validateLongTextValue,
    validateNameValue,
    validateTextValue
} from '../../../../shared/validators';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ScrollRevealDirective],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
    contactForm: FormGroup;
    isSubmitting = false;
    isSuccess = false;

    constructor(private fb: FormBuilder, private dataService: DataService) {
        this.contactForm = this.fb.group({
            name: ['', [Validators.required, this.createValidator((value) =>
                validateNameValue(value, { required: true, label: 'El nombre' })
            )]],
            email: ['', [Validators.required, this.createValidator((value) =>
                validateEmailValue(value, { required: true, label: 'El correo electrónico' })
            )]],
            phone: ['', [this.createValidator((value) => {
                const sanitizedPhone = sanitizePlainText(value, {
                    trim: true,
                    collapseWhitespace: true,
                    stripHtml: true,
                    maxLength: 20
                });

                if (!sanitizedPhone) {
                    return [];
                }

                return validateTextValue(sanitizedPhone, {
                    required: false,
                    label: 'El teléfono',
                    minLength: 7,
                    maxLength: 20,
                    pattern: /^[0-9+\-\s()]{7,20}$/,
                    patternMessage: 'El teléfono solo acepta números y símbolos + - ( ).'
                });
            })]],
            message: ['', [Validators.required, this.createValidator((value) =>
                validateLongTextValue(value, 'El mensaje')
            )]]
        });
    }

    onSubmit() {
        if (this.contactForm.valid) {
            this.isSubmitting = true;
            const payload = {
                name: prepareTextForSubmission(this.contactForm.get('name')?.value, { maxLength: 50 }),
                email: sanitizeEmail(this.contactForm.get('email')?.value),
                phone: prepareTextForSubmission(this.contactForm.get('phone')?.value, { maxLength: 20 }),
                message: prepareTextForSubmission(this.contactForm.get('message')?.value, {
                    allowLineBreaks: true,
                    maxLength: 500
                })
            };

            this.dataService.sendContactForm(payload).subscribe({
                next: (success) => {
                    this.isSubmitting = false;
                    if (success) {
                        this.isSuccess = true;
                        this.contactForm.reset();
                        setTimeout(() => this.isSuccess = false, 5000);
                    }
                },
                error: (err) => {
                    console.error('Error sending form', err);
                    this.isSubmitting = false;
                }
            });
        } else {
            this.contactForm.markAllAsTouched();
        }
    }

    isControlInvalid(controlName: string): boolean {
        const control = this.contactForm.get(controlName);
        if (!control) {
            return false;
        }
        return control.invalid && (control.dirty || control.touched);
    }

    isControlValid(controlName: string): boolean {
        const control = this.contactForm.get(controlName);
        if (!control) {
            return false;
        }

        const hasValue = String(control.value ?? '').trim().length > 0;
        return control.valid && (control.dirty || control.touched) && hasValue;
    }

    getControlError(controlName: string): string | null {
        const control = this.contactForm.get(controlName);
        if (!control || !(control.dirty || control.touched) || !control.errors) {
            return null;
        }

        if (control.errors['required']) {
            if (controlName === 'name') return 'El nombre es obligatorio.';
            if (controlName === 'email') return 'El correo electrónico es obligatorio.';
            if (controlName === 'message') return 'El mensaje es obligatorio.';
            return 'Este campo es obligatorio.';
        }

        const customErrors = control.errors['customValidation'] as string[] | undefined;
        if (customErrors && customErrors.length > 0) {
            return customErrors[0];
        }

        return 'Corrige este campo.';
    }

    private createValidator(rules: (value: string) => string[]): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const errors = rules(String(control.value ?? ''));
            return errors.length > 0 ? { customValidation: errors } : null;
        };
    }
}
