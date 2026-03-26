import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

interface FooterQuickLink {
    label: string;
    sectionId: string;
}

interface LegalSection {
    heading: string;
    paragraphs: string[];
}

interface LegalDocument {
    id: 'terminos' | 'privacidad' | 'aviso' | 'cookies';
    title: string;
    subtitle: string;
    updatedAt: string;
    sections: LegalSection[];
}

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    host: {
        '[class.footer-modal-open]': 'activeLegalDocument !== null'
    }
})
export class FooterComponent implements OnDestroy {
    currentYear = new Date().getFullYear();

    readonly quickLinks: FooterQuickLink[] = [
        { label: 'Nosotros', sectionId: 'about' },
        { label: 'Servicios', sectionId: 'services' },
        { label: 'Cómo Funciona', sectionId: 'process' },
        { label: 'Testimonios', sectionId: 'testimonials' },
        { label: 'FAQ', sectionId: 'faq' },
        { label: 'Contáctanos', sectionId: 'contact' }
    ];

    readonly services: string[] = [
        'Monitoreo IoT',
        'Riego Automatizado',
        'Análisis de Datos',
        'Consultoría Agrícola',
        'Capacitación'
    ];

    readonly legalDocuments: Record<LegalDocument['id'], LegalDocument> = {
        terminos: {
            id: 'terminos',
            title: 'Términos y Condiciones',
            subtitle: 'Condiciones de uso de la plataforma Huerto Connect.',
            updatedAt: 'Actualizado: 21 de marzo de 2026',
            sections: [
                {
                    heading: '1. Uso de la Plataforma',
                    paragraphs: [
                        'Huerto Connect se ofrece para gestión agrícola, monitoreo y consulta de información técnica.',
                        'Al utilizar el servicio, el usuario acepta usar la plataforma de forma lícita, sin afectar la seguridad o disponibilidad del sistema.'
                    ]
                },
                {
                    heading: '2. Cuenta y Responsabilidades',
                    paragraphs: [
                        'Cada usuario es responsable del resguardo de sus credenciales y de la actividad realizada en su cuenta.',
                        'Cualquier uso no autorizado debe reportarse de inmediato para aplicar medidas de protección.'
                    ]
                },
                {
                    heading: '3. Disponibilidad y Cambios',
                    paragraphs: [
                        'Podemos realizar mejoras, ajustes técnicos o mantenimiento programado para mantener la continuidad del servicio.',
                        'Cuando aplique, se informarán cambios relevantes que impacten funcionalidad o condiciones de uso.'
                    ]
                }
            ]
        },
        privacidad: {
            id: 'privacidad',
            title: 'Política de Privacidad',
            subtitle: 'Cómo tratamos y protegemos la información del usuario.',
            updatedAt: 'Actualizado: 21 de marzo de 2026',
            sections: [
                {
                    heading: '1. Datos que Recopilamos',
                    paragraphs: [
                        'Recopilamos datos de registro, contacto y uso para operar la cuenta, mejorar experiencia y brindar soporte.',
                        'Los datos se solicitan bajo principio de minimización: sólo información necesaria para la finalidad del servicio.'
                    ]
                },
                {
                    heading: '2. Finalidad del Tratamiento',
                    paragraphs: [
                        'La información se usa para autenticación, comunicación, métricas de uso y mejora continua de funcionalidades.',
                        'No vendemos información personal a terceros.'
                    ]
                },
                {
                    heading: '3. Derechos del Titular',
                    paragraphs: [
                        'Puedes solicitar acceso, rectificación o eliminación de tus datos conforme a la normatividad aplicable.',
                        'Para ejercer derechos, usa el formulario de contacto o el correo oficial indicado en esta sección.'
                    ]
                }
            ]
        },
        aviso: {
            id: 'aviso',
            title: 'Aviso Legal',
            subtitle: 'Información general sobre titularidad y alcance del contenido.',
            updatedAt: 'Actualizado: 21 de marzo de 2026',
            sections: [
                {
                    heading: '1. Titularidad del Sitio',
                    paragraphs: [
                        'El contenido, diseño e identidad visual de Huerto Connect están protegidos por la legislación aplicable.',
                        'Su reproducción total o parcial requiere autorización previa cuando corresponda.'
                    ]
                },
                {
                    heading: '2. Uso de Información',
                    paragraphs: [
                        'Las recomendaciones y materiales tienen fines informativos y de apoyo a la toma de decisiones.',
                        'El usuario mantiene la responsabilidad final sobre sus decisiones operativas en campo.'
                    ]
                },
                {
                    heading: '3. Enlaces y Terceros',
                    paragraphs: [
                        'En caso de incluir enlaces externos, Huerto Connect no controla su disponibilidad ni contenido.',
                        'Se recomienda revisar políticas de cada tercero antes de interactuar con sus servicios.'
                    ]
                }
            ]
        },
        cookies: {
            id: 'cookies',
            title: 'Política de Cookies',
            subtitle: 'Uso de cookies para operación, seguridad y mejora del sitio.',
            updatedAt: 'Actualizado: 21 de marzo de 2026',
            sections: [
                {
                    heading: '1. Qué son las Cookies',
                    paragraphs: [
                        'Son archivos pequeños que permiten recordar preferencias y optimizar navegación.',
                        'Huerto Connect utiliza cookies técnicas necesarias para funcionamiento básico de la experiencia web.'
                    ]
                },
                {
                    heading: '2. Tipos de Cookies',
                    paragraphs: [
                        'Usamos cookies esenciales y, cuando corresponda, cookies analíticas para mejorar rendimiento del sitio.',
                        'No se usan cookies para vender información personal ni para fines contrarios a la privacidad del usuario.'
                    ]
                },
                {
                    heading: '3. Gestión de Preferencias',
                    paragraphs: [
                        'Puedes administrar cookies desde la configuración de tu navegador.',
                        'Deshabilitar cookies esenciales puede afectar ciertas funciones del sitio.'
                    ]
                }
            ]
        }
    };

    activeLegalDocument: LegalDocument | null = null;

    constructor(
        private readonly router: Router,
        @Inject(DOCUMENT) private readonly document: Document
    ) { }

    ngOnDestroy(): void {
        this.unlockBodyScroll();
    }

    onQuickLinkClick(event: Event, sectionId: string): void {
        event.preventDefault();
        this.scrollToSection(sectionId);
    }

    openLegalModal(event: Event, documentId: LegalDocument['id']): void {
        event.preventDefault();
        this.activeLegalDocument = this.legalDocuments[documentId];
        this.lockBodyScroll();
    }

    closeLegalModal(): void {
        this.activeLegalDocument = null;
        this.unlockBodyScroll();
    }

    onOverlayClick(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.closeLegalModal();
        }
    }

    @HostListener('document:keydown.escape')
    onEscapePressed(): void {
        if (this.activeLegalDocument) {
            this.closeLegalModal();
        }
    }

    trackBySection(_index: number, section: LegalSection): string {
        return section.heading;
    }

    private scrollToSection(sectionId: string): void {
        const scroll = () => {
            const element = this.document.getElementById(sectionId);
            if (!element) {
                return;
            }
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };

        if (this.router.url !== '/') {
            this.router.navigateByUrl('/').then(() => {
                window.setTimeout(scroll, 120);
            });
            return;
        }

        scroll();
    }

    private lockBodyScroll(): void {
        this.document.body.style.overflow = 'hidden';
    }

    private unlockBodyScroll(): void {
        this.document.body.style.overflow = '';
    }
}
