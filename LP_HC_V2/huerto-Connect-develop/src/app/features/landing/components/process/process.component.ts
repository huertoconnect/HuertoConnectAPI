import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
    selector: 'app-process',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './process.component.html',
    styleUrls: ['./process.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProcessComponent implements OnInit, OnDestroy {
    screens = [
        {
            id: 'perfil',
            label: 'Perfil',
            icon: 'person-outline',
            title: 'Define tu Perfil',
            desc: 'Indica tu nivel de experiencia agrícola para que la Inteligencia Artificial adapte sus recomendaciones y consejos técnicos a tus conocimientos previos.',
            features: [
                { text: 'Adaptación de lenguaje técnico', icon: 'language-outline' },
                { text: 'Recomendaciones personalizadas', icon: 'bulb-outline' },
                { text: 'Curva de aprendizaje guiada', icon: 'school-outline' }
            ]
        },
        {
            id: 'area',
            label: 'Terreno',
            icon: 'grid-outline',
            title: 'Área de Cultivo',
            desc: 'Establece las dimensiones exactas de tu huerto. Esto le permite al sistema calcular requerimientos de agua, semillas y fertilizantes de forma automática.',
            features: [
                { text: 'Cálculo de insumos automático', icon: 'calculator-outline' },
                { text: 'Estimación de rendimiento', icon: 'trending-up-outline' },
                { text: 'Distribución espacial óptima', icon: 'map-outline' }
            ]
        },
        {
            id: 'agua',
            label: 'Ubicación y Agua',
            icon: 'water-outline',
            title: 'Contexto Ambiental',
            desc: 'La disponibilidad de agua y tu ubicación geográfica definen qué cultivos serán viables. Huerto Connect ajusta el cronograma según tu clima y tipo de riego.',
            features: [
                { text: 'Gestión eficiente de recursos', icon: 'water-outline' },
                { text: 'Prevención de estrés hídrico', icon: 'shield-checkmark-outline' },
                { text: 'Alertas meteorológicas', icon: 'thunderstorm-outline' }
            ]
        },
        {
            id: 'inicio',
            label: 'Inicio',
            icon: 'home-outline',
            title: 'Tu Panel Central',
            desc: 'Un espacio centralizado que resume la salud general de tu cultivo, te notifica sobre acciones importantes y te da acceso inmediato al motor gráfico de análisis.',
            features: [
                { text: 'Rastreo de actividades diarias', icon: 'clipboard-outline' },
                { text: 'Notificaciones oportunas', icon: 'notifications-outline' },
                { text: 'Visión integral del huerto', icon: 'eye-outline' }
            ]
        }
    ];

    activeScreenId = 'perfil';

    steps = [
        {
            number: '01',
            title: 'Configura tu Perfil',
            desc: 'Ingresa datos de tu terreno, fuente de agua, ubicación y zona climática.',
            icon: 'options-outline'
        },
        {
            number: '02',
            title: 'IA Sugiere Cultivos',
            desc: 'La inteligencia artificial analiza tu región y recomienda los cultivos ideales.',
            icon: 'hardware-chip-outline'
        },
        {
            number: '03',
            title: 'Selecciona tu Siembra',
            desc: 'Elige si ya sembraste o si estás por sembrar y recibe tips personalizados.',
            icon: 'leaf-outline'
        },
        {
            number: '04',
            title: 'Cronograma Inteligente',
            desc: 'Obtén tu línea de tiempo, programa actividades y fecha estimada de cosecha.',
            icon: 'calendar-outline'
        }
    ];

    activeStepIndex = 0;
    private stepInterval: any;
    private screenInterval: any;

    constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) { }

    ngOnInit() {
        this.startStepCycle();
        this.startScreenCycle();
    }

    private startStepCycle() {
        this.stepInterval = setTimeout(() => {
            this.ngZone.run(() => {
                this.activeStepIndex = (this.activeStepIndex + 1) % this.steps.length;
                this.cdr.detectChanges();
                this.startStepCycle();
            });
        }, 3000);
    }

    private startScreenCycle() {
        this.screenInterval = setTimeout(() => {
            this.ngZone.run(() => {
                const currentIndex = this.screens.findIndex(s => s.id === this.activeScreenId);
                const nextIndex = (currentIndex + 1) % this.screens.length;
                this.activeScreenId = this.screens[nextIndex].id;
                this.cdr.detectChanges();
                this.startScreenCycle();
            });
        }, 5000);
    }

    ngOnDestroy() {
        if (this.stepInterval) {
            clearTimeout(this.stepInterval);
        }
        if (this.screenInterval) {
            clearTimeout(this.screenInterval);
        }
    }

    setActiveScreen(id: string) {
        this.activeScreenId = id;
        // Reset screen cycle when user clicks manually
        if (this.screenInterval) {
            clearTimeout(this.screenInterval);
        }
        this.startScreenCycle();
    }

    nextScreen() {
        const currentIndex = this.screens.findIndex(s => s.id === this.activeScreenId);
        const nextIndex = (currentIndex + 1) % this.screens.length;
        this.activeScreenId = this.screens[nextIndex].id;
        // Reset screen cycle
        if (this.screenInterval) {
            clearTimeout(this.screenInterval);
        }
        this.startScreenCycle();
    }

    get activeScreen() {
        return this.screens.find(s => s.id === this.activeScreenId) || this.screens[0];
    }
}
