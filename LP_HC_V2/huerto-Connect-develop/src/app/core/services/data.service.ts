import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Testimonial {
    name: string;
    role: string;
    location: string;
    text: string;
    rating: number;
    image: string;
    cover: string;
}

export interface FAQ {
    question: string;
    answer: string;
    open?: boolean;
}

export interface ContactData {
    name: string;
    email: string;
    phone?: string;
    message: string;
}

export interface HeroData {
    badge: string;
    title: string;
    highlight: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: { value: string; label: string }[];
    backgroundImage: string;
}

export interface HeaderLink {
    label: string;
    sectionId: string;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly http = inject(HttpClient);
    private readonly publicBase = `${environment.apiUrl}/api/public`;

    constructor() { }

    getHeaderLinks(): Observable<HeaderLink[]> {
        const links: HeaderLink[] = [
            { label: 'Nosotros', sectionId: 'about' },
            { label: 'Servicios', sectionId: 'services' },
            { label: 'Proceso', sectionId: 'process' },
            { label: 'Testimonios', sectionId: 'testimonials' },
            { label: 'FAQ', sectionId: 'faq' }
        ];
        return of(links).pipe(delay(100));
    }

    getHeroData(): Observable<HeroData> {
        const data: HeroData = {
            badge: 'Agricultura Inteligente',
            title: 'Tu Huerto,',
            highlight: 'Infinitas Posibilidades',
            subtitle: 'Cosecha más, usa menos. Tecnología que respeta la tierra y multiplica tus resultados.',
            ctaPrimary: 'Comenzar Ahora →',
            ctaSecondary: 'Ver Demo',
            stats: [
                { value: '500+', label: 'Huertos Activos' },
                { value: '98%', label: 'Satisfacción' },
                { value: '24/7', label: 'Monitoreo' }
            ],
            backgroundImage: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        };
        return of(data).pipe(delay(200));
    }

    getTestimonials(): Observable<Testimonial[]> {
        const data: Testimonial[] = [
            {
                name: 'Carlos Ramírez',
                role: 'Productor de Tomate',
                location: 'Veracruz',
                text: 'Duplicamos nuestra producción en 6 meses. El sistema de riego automático me ahorra 3 horas diarias. Increíble inversión.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1583160867452-944a1ac94e1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            {
                name: 'María González',
                role: 'Agricultora Orgánica',
                location: 'Xalapa',
                text: 'Como productora orgánica, la detección temprana de plagas cambió todo. Reduje pérdidas en 85% sin usar químicos.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1625246333195-098705332fc0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            },
            {
                name: 'José Hernández',
                role: 'Invernadero Familiar',
                location: 'Córdoba',
                text: 'ROI en menos de 18 meses. Ahora compito con grandes productores. La tecnología niveló el campo de juego.',
                rating: 5,
                image: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
                cover: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            }
        ];
        return of(data).pipe(delay(500)); // Simulate network latency
    }

    getFAQs(): Observable<FAQ[]> {
        const data: FAQ[] = [
            {
                question: '¿Cómo funciona la asistencia con Inteligencia Artificial?',
                answer: 'Nuestra IA analiza tus cultivos, ubicación y condiciones climáticas para brindarte recomendaciones personalizadas en tiempo real. Puedes hacer preguntas sobre plagas, riego, fertilización y más, y recibirás respuestas adaptadas a tu situación específica.'
            },
            {
                question: '¿Es útil si no tengo experiencia en agricultura?',
                answer: '¡Absolutamente! Huerto Connect está diseñado tanto para principiantes como para expertos. Te guiamos paso a paso con tutoriales, cronogramas de actividades y alertas. Si tienes conocimiento empírico, la app te ayuda a optimizarlo con técnicas modernas.'
            },
            {
                question: '¿Cómo se adapta la app a mi tipo de siembra y ubicación?',
                answer: 'Al registrarte, configuras tu perfil con el tipo de cultivo, clima de tu región y características de tu terreno. La IA utiliza estos datos para personalizar todas las recomendaciones, calendarios y técnicas sugeridas.'
            },
            {
                question: '¿Qué tan disponible está el soporte técnico?',
                answer: 'Ofrecemos asistencia 24/7. Puedes consultar a la IA en cualquier momento, y nuestro equipo humano está disponible para casos que requieran atención especializada.'
            },
            {
                question: '¿Qué incluye el cronograma de actividades?',
                answer: 'El cronograma te muestra cuándo sembrar, regar, fertilizar, podar y cosechar. Se genera automáticamente según tu cultivo, ubicación y temporada. Además, puedes registrar tus actividades para llevar un historial completo.'
            },
            {
                question: '¿Cómo funciona la comunidad de agricultores?',
                answer: 'Dentro de la app encontrarás una comunidad donde puedes compartir experiencias, hacer preguntas a otros agricultores, intercambiar técnicas y aprender de casos reales. Juntos crecemos mejor.'
            },
            {
                question: '¿Puedo aprender nuevas técnicas de cultivo?',
                answer: 'Sí, la app incluye una sección de técnicas modernas y tradicionales, desde hidroponía hasta métodos orgánicos. La IA te sugiere las más adecuadas para tu situación y nivel de experiencia.'
            },
            {
                question: '¿Cómo registro y monitoreo mis cultivos?',
                answer: 'La app te permite registrar cada cultivo con fotos, notas y métricas. Puedes hacer seguimiento del crecimiento, detectar problemas temprano con análisis de imágenes y mantener un historial completo de tu producción.'
            }
        ];
        return of(data).pipe(delay(300));
    }

    sendContactForm(data: ContactData): Observable<boolean> {
        const payload = {
            nombre: data.name,
            email: data.email,
            telefono: data.phone ?? '',
            mensaje: data.message
        };

        return this.http.post(`${this.publicBase}/contacto`, payload).pipe(
            map(() => true),
            catchError((error) => {
                console.error('Error sending contact form:', error);
                return of(false);
            })
        );
    }
}
