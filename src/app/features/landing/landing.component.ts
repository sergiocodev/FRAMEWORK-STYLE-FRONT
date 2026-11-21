import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../core/services/theme.service';

interface CodeSnippet {
  id: string;
  name: string;
  language: string;
  filename: string;
  phaseOrigin: string;
  description: string;
  code: string;
}

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  exampleOutput: string;
  svgIcon: string;
}

interface FrameworkPhase {
  number: number;
  name: string;
  subtext: string;
  tagline: string;
  description: string;
  colorClass: string;
  syntaxColor: string;
  deliverables: string[];
  bestPractices: string[];
}

interface DocGuide {
  id: string;
  title: string;
  category: string;
  phaseNumber?: number;
  readTime: string;
  badge: string;
  description: string;
  rulePreview: string;
  path: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  readonly themeService = inject(ThemeService);

  // Active exported code snippet preview tab
  activeTab = signal<string>('css');

  // Selected phase in the 5-phase interactive workflow
  selectedPhase = signal<number>(3);

  // Clipboard feedback signals
  copiedSnippet = signal<string | null>(null);
  copiedIntegration = signal<boolean>(false);

  // Active integration details modal
  activeIntegration = signal<Integration | null>(null);

  // Interactive Aesthetic Audit Simulation state
  isSimulating = signal<boolean>(false);

  // Documentation search query
  docsFilter = signal<string>('');

  // -------------------------------------------------------------
  // LAS 5 FASES DEL ASISTENTE STYLE (BUENAS PRÁCTICAS ESTÉTICAS)
  // -------------------------------------------------------------
  readonly frameworkPhases: FrameworkPhase[] = [
    {
      number: 1,
      name: 'Investigación',
      subtext: 'Entradas del proyecto',
      tagline: 'Define el contexto, los usuarios y las expectativas estéticas',
      description: 'El asistente te guía para documentar la necesidad real del software, caracterizar perfiles de usuario, recopilar referencias visuales y fijar criterios estéticos antes de trazar la primera pantalla.',
      colorClass: 'phase-cyan',
      syntaxColor: '#38BDF8',
      deliverables: ['Definición de Necesidad', 'Perfiles de Usuario', 'Expectativas Estéticas', 'Recursos y Referencias'],
      bestPractices: ['Alineación con el público objetivo', 'Benchmarking visual documentado']
    },
    {
      number: 2,
      name: 'Diseño Conceptual',
      subtext: 'Estructura y flujo',
      tagline: 'Arquitectura de información, navegación y wireframes Lo-Fi',
      description: 'Organiza el inventario de contenidos, define flujos de navegación, construye wireframes de baja fidelidad y valida la estructura mediante checklists de buenas prácticas conceptuales.',
      colorClass: 'phase-purple',
      syntaxColor: '#C084FC',
      deliverables: ['Inventario de Contenidos', 'Árbol de Navegación', 'Wireframes Lo-Fi', 'Checklists Conceptuales'],
      bestPractices: ['Jerarquía visual previa al color', 'Reducción de carga cognitiva']
    },
    {
      number: 3,
      name: 'Diseño Visual',
      subtext: 'Guía visual y tokens',
      tagline: 'Paletas armónicas, WCAG 2.2, tipografía algorítmica e iconografía',
      description: 'Asistente visual interactivo con escalas tonales 50–900, regla cromática 60-30-10, validador de contraste WCAG AA/AAA, algoritmos de emparejamiento tipográfico (Choi & Hyun, 2024), optical tracking, catálogo Iconify y exportación de tokens.',
      colorClass: 'phase-pink',
      syntaxColor: '#F472B6',
      deliverables: ['Paleta Armónica + Escala 50–900', 'Tipografía Modular & Tracking', 'Biblioteca de Iconos', 'BrandBook + Exportación CSS/Tailwind/SCSS/JSON'],
      bestPractices: ['Contraste WCAG 2.2 AAA (7:1)', 'Emparejamiento morfológico tipográfico', 'Retícula de 12 columnas y escala de 8px']
    },
    {
      number: 4,
      name: 'Diseño Detallado',
      subtext: 'Prototipo de alta fidelidad',
      tagline: 'Revisión asistida de pantallas Hi-Fi contra tu sistema visual',
      description: 'Carga tus pantallas de alta fidelidad por cada vista definida en Fase 2. El asistente verifica colores, tipografías, iconografía y espaciado detectando alertas entre lo esperado y lo aplicado.',
      colorClass: 'phase-amber',
      syntaxColor: '#FBBF24',
      deliverables: ['Pantallas Hi-Fi por Vista', 'Alertas de Desviación Visual', 'Checklist de Consistencia', 'Control de Estado de Diseño'],
      bestPractices: ['Cero estilos hardcodeados', 'Coherencia entre guía visual y prototipo']
    },
    {
      number: 5,
      name: 'Evaluación Estética',
      subtext: 'Validación científica',
      tagline: 'Audita la estética de tu GUI con 4 métodos complementarios',
      description: 'Mide objetivamente la calidad estética de tus interfaces mediante Revisión Heurística, Topología Gestalt (TDA con Vietoris-Rips), encuestas públicas VisAWI y el Modelo Calista AI, registrando hallazgos trazables.',
      colorClass: 'phase-emerald',
      syntaxColor: '#34D399',
      deliverables: ['Revisión Heurística Guiada', 'Topología Gestalt (TDA)', 'Encuesta Pública VisAWI', 'Diagnóstico Calista AI + Hallazgos'],
      bestPractices: ['Persistencia homológica (0-PD / 1-PD)', '4 dimensiones VisAWI', 'Balance visual y armonía Calista (Delitzas 2023)']
    }
  ];

  // -------------------------------------------------------------
  // CODE SNIPPET PREVIEWS: ARTEFACTOS REALES QUE EXPORTA STYLE
  // (Sin librerías ni paquetes inventados)
  // -------------------------------------------------------------
  readonly codeSnippets: Record<string, CodeSnippet> = {
    css: {
      id: 'css',
      name: 'CSS Variables',
      language: 'css',
      filename: 'tokens.css',
      phaseOrigin: 'Exportado desde Fase 3 · BrandBook Showcase',
      description: 'Variables CSS listas para pegar en tu hoja de estilos global (colores, tipografía, tracking, retícula y espaciado).',
      code: `/* ==========================================================================
   DESIGN TOKENS - CSS VARIABLES
   Auto-generado desde STYLE · BrandBook Showcase (Fase 3)
   ========================================================================== */
:root {
  /* Paleta Armónica (Regla 60-30-10 + Contraste WCAG AAA) */
  --color-principal: #2563EB;
  --color-principal-rgb: 37, 99, 235;
  --color-secundario: #7C3AED;
  --color-acento: #10B981;
  --color-fondo: #090D16;
  --color-superficie: #0F1523;
  --color-texto-principal: #F8FAFC;

  /* Tipografía Modular & Optical Tracking */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --tracking-h1: -0.022em;
  --line-height-body: 1.6;

  /* Retícula & Escala de Espaciado (Base 8px) */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --radius-base: 8px;
  --grid-columns: 12;
  --grid-gutter: 16px;
}`
    },
    tailwind: {
      id: 'tailwind',
      name: 'Tailwind Config',
      language: 'javascript',
      filename: 'tailwind.config.js',
      phaseOrigin: 'Exportado desde Fase 3 · BrandBook Showcase',
      description: 'Extensión de tema lista para integrar tu sistema visual de STYLE en cualquier proyecto con Tailwind CSS.',
      code: `// Auto-generado desde STYLE · Asistente de Diseño Visual (Fase 3)
/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        principal: '#2563EB',
        secundario: '#7C3AED',
        acento: '#10B981',
        fondo: '#090D16',
        superficie: '#0F1523',
        exito: '#10B981',
        advertencia: '#F59E0B',
        error: '#EF4444'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      borderRadius: {
        base: '8px'
      },
      spacing: {
        gutter: '16px'
      }
    }
  }
};`
    },
    scss: {
      id: 'scss',
      name: 'SCSS Tokens',
      language: 'scss',
      filename: '_tokens.scss',
      phaseOrigin: 'Exportado desde Fase 3 · BrandBook Showcase',
      description: 'Variables SCSS y escala tonal 50–900 listas para proyectos Angular, Bootstrap o Sass.',
      code: `// Auto-generado desde STYLE · BrandBook Showcase (Fase 3)
// Paleta Semántica y Escala Tonal
$color-principal: #2563EB;
$color-principal-100: #DBEAFE;
$color-principal-500: #2563EB;
$color-principal-900: #1E3A8A;

$color-secundario: #7C3AED;
$color-acento: #10B981;
$color-fondo: #090D16;
$color-texto: #F8FAFC;

// Tipografía y Ritmo Vertical (Escala Major Third 1.25)
$font-primary: 'Inter', sans-serif;
$font-mono: 'JetBrains Mono', monospace;
$font-size-base: 16px;
$scale-ratio: 1.25;

// Espaciado y Geometría
$spacing-base: 8px;
$radius-base: 8px;
$icon-stroke: 1.5px;`
    },
    dtcg: {
      id: 'dtcg',
      name: 'W3C DTCG JSON',
      language: 'json',
      filename: 'design-tokens.dtcg.json',
      phaseOrigin: 'Exportado desde Fase 3 · Inspector de Tokens',
      description: 'Formato estándar W3C Design Tokens Community Group para interoperar con Figma Tokens Studio y herramientas de diseño.',
      code: `{
  "color": {
    "principal": {
      "$value": "#2563EB",
      "$type": "color",
      "$description": "Color principal (60%) validado con contraste WCAG 2.2 AAA"
    },
    "acento": {
      "$value": "#10B981",
      "$type": "color",
      "$description": "Color de acento (10%) para acciones primarias"
    }
  },
  "typography": {
    "heading": {
      "$value": {
        "fontFamily": "Inter",
        "fontWeight": 700,
        "letterSpacing": "-0.022em",
        "lineHeight": 1.2
      },
      "$type": "typography"
    }
  },
  "spacing": {
    "md": { "$value": "16px", "$type": "dimension" }
  }
}`
    },
    report: {
      id: 'report',
      name: 'Reporte Fase 5',
      language: 'json',
      filename: 'evaluacion-estetica.report.json',
      phaseOrigin: 'Generado en Fase 5 · Evaluación Estética Integral',
      description: 'Resumen estructurado del diagnóstico estético (VisAWI, Calista AI, Gestalt TDA y Hallazgos trazables).',
      code: `{
  "proyecto": "Dashboard Analítico FinTech",
  "score_estetico": 94.6,
  "nivel_madurez": "Excepcional",
  "visawi_metricas": {
    "simplicidad": 6.7,
    "claridad": 6.8,
    "diversidad": 6.2,
    "armonia": 6.6,
    "score_global": 6.58
  },
  "calista_ai": {
    "categoria": "Alta",
    "balance_visual": 94.2,
    "armonia_color": 96.0,
    "complejidad_espacio": 91.5
  },
  "topologia_gestalt_tda": {
    "componentes_0pd": 4,
    "ciclos_h1_ruido": 0,
    "estado": "Aprobado"
  },
  "hallazgos_criticos": 0
}`
    }
  };

  // -------------------------------------------------------------
  // TABLA COMPARATIVA: STYLE ASISTENTE VS ENFOQUES TRADICIONALES
  // -------------------------------------------------------------
  readonly comparisonFeatures = [
    {
      name: 'Flujo Guiado de 5 Fases con Buenas Prácticas',
      description: 'Acompañamiento paso a paso desde Investigación y Wireframes hasta la Evaluación Estética final',
      style: { supported: true, text: 'Asistente Integral (Fases 1 a 5)', badge: 'Metodología GUI' },
      intuition: { supported: false, text: 'Improvisación sin trazabilidad' },
      figma: { supported: false, text: 'Lienzo libre sin guía metodológica' },
      checkers: { supported: false, text: 'Verificaciones aisladas al final' }
    },
    {
      name: 'Asistente de Color 60-30-10 + WCAG 2.2 AAA',
      description: 'Generación de escalas tonales 50–900, validación de contraste AA/AAA y simulación de daltonismo',
      style: { supported: true, text: 'Validación en vivo + Escala 50–900', badge: 'Accesible' },
      intuition: { supported: false, text: 'Colores elegidos a ojo' },
      figma: { supported: false, text: 'Requiere plugins externos manuales' },
      checkers: { supported: true, text: 'Solo mide pares aislados de color' }
    },
    {
      name: 'Algoritmos de Tipografía y Optical Tracking',
      description: 'Emparejamiento morfológico (Choi & Hyun, 2024), escalas modulares e interlineado dinámico',
      style: { supported: true, text: 'Fórmulas científicas + Vista previa', badge: 'Tipografía Pro' },
      intuition: { supported: false, text: 'Tamaños arbitrarios sin escala' },
      figma: { supported: false, text: 'Estilos manuales sin validación' },
      checkers: { supported: false, text: 'No evalúa armonía tipográfica' }
    },
    {
      name: 'Exportación de Código Lista para Desarrollo',
      description: 'Genera al instante CSS Variables, Tailwind Config, SCSS y W3C DTCG JSON sin instalar librerías',
      style: { supported: true, text: 'CSS, Tailwind, SCSS y DTCG JSON', badge: 'Copy & Paste' },
      intuition: { supported: false, text: 'Valores escritos a mano en CSS' },
      figma: { supported: true, text: 'Inspección básica o plugins de pago' },
      checkers: { supported: false, text: 'No genera design tokens' }
    },
    {
      name: 'Revisión Asistida de Pantallas Hi-Fi (Fase 4)',
      description: 'Compara tus prototipos contra la guía visual de Fase 3 para detectar desviaciones de color o fuente',
      style: { supported: true, text: 'Alertas Detectado vs. Esperado', badge: 'Consistencia' },
      intuition: { supported: false, text: 'Inconsistencias pasan a producción' },
      figma: { supported: false, text: 'Revisión manual pantalla por pantalla' },
      checkers: { supported: false, text: 'No conoce tu sistema visual' }
    },
    {
      name: 'Encuestas Públicas VisAWI Integradas',
      description: 'Genera un enlace público para medir Simplicidad, Claridad, Diversidad y Armonía con usuarios reales',
      style: { supported: true, text: 'Enlace compartible + Score automático', badge: 'Psicométrico' },
      intuition: { supported: false, text: 'Opiniones informales sin métrica' },
      figma: { supported: false, text: 'No incluye evaluación psicométrica' },
      checkers: { supported: false, text: 'No disponible' }
    },
    {
      name: 'Diagnóstico con IA (Modelo Calista 2023)',
      description: 'Analiza imágenes de tus pantallas para cuantificar balance visual, armonía cromática y complejidad',
      style: { supported: true, text: 'Visión Artificial + Sugerencias', badge: 'Calista AI' },
      intuition: { supported: false, text: 'Imposible de cuantificar' },
      figma: { supported: false, text: 'No disponible' },
      checkers: { supported: false, text: 'Solo analiza código DOM, no estética' }
    },
    {
      name: 'Topología Gestalt con TDA (Vietoris-Rips)',
      description: 'Evalúa agrupamiento espacial, proximidad y ruido visual mediante persistencia homológica (0-PD / 1-PD)',
      style: { supported: true, text: 'Análisis Topológico Interactivo', badge: 'Gestalt TDA' },
      intuition: { supported: false, text: 'Revisión visual subjetiva' },
      figma: { supported: false, text: 'Solo cuadrículas estáticas' },
      checkers: { supported: false, text: 'No analiza leyes de la Gestalt' }
    }
  ];

  // -------------------------------------------------------------
  // COMPATIBILIDAD DE FLUJO Y FORMATOS (SIN PAQUETES INVENTADOS)
  // -------------------------------------------------------------
  readonly integrations: Integration[] = [
    {
      id: 'css-vars',
      name: 'CSS3 Custom Properties',
      category: 'Exportación Fase 3',
      description: 'Copia o descarga tus variables `:root` de colores, tipografía, espaciado y radios listas para cualquier proyecto web.',
      badge: 'Exportación Nativa',
      exampleOutput: '--color-principal: #2563EB; --spacing-md: 16px;',
      svgIcon: 'css'
    },
    {
      id: 'tailwind',
      name: 'Tailwind CSS',
      category: 'Exportación Fase 3',
      description: 'Exporta el bloque `theme.extend` directamente desde el BrandBook Showcase para sincronizar tu diseño con Tailwind.',
      badge: 'tailwind.config.js',
      exampleOutput: "colors: { principal: '#2563EB', acento: '#10B981' }",
      svgIcon: 'tailwind'
    },
    {
      id: 'scss',
      name: 'Sass / SCSS',
      category: 'Exportación Fase 3',
      description: 'Genera parciales `_tokens.scss` con tu paleta semántica y escala tonal 50–900 para Angular, Bootstrap o Vite.',
      badge: '_tokens.scss',
      exampleOutput: '$color-principal: #2563EB; $radius-base: 8px;',
      svgIcon: 'scss'
    },
    {
      id: 'dtcg',
      name: 'W3C Design Tokens (DTCG)',
      category: 'Estándar Interoperable',
      description: 'Exporta tokens en formato oficial JSON W3C (`$value`, `$type`, `$description`) compatible con plataformas de diseño.',
      badge: 'JSON Estándar',
      exampleOutput: '{ "$value": "#2563EB", "$type": "color" }',
      svgIcon: 'json'
    },
    {
      id: 'figma',
      name: 'Figma (Pantallas y Tokens)',
      category: 'Flujo Fase 3, 4 y 5',
      description: 'Lleva tus tokens DTCG a Figma e importa capturas de tus prototipos Hi-Fi en Fase 4 y 5 para auditarlos con Calista AI y Gestalt TDA.',
      badge: 'Flujo Bidireccional',
      exampleOutput: 'Importar PNG/JPG Hi-Fi → Revisión de alertas + Calista AI',
      svgIcon: 'figma'
    },
    {
      id: 'iconify',
      name: 'Iconify (Lucide, Heroicons, BS)',
      category: 'Biblioteca Fase 3',
      description: 'Explora y selecciona conjuntos consistentes de iconos vectoriales (trazo uniforme y peso óptico) integrados en el asistente.',
      badge: '100k+ Iconos SVG',
      exampleOutput: 'Lucide · Heroicons · Bootstrap Icons · Material Symbols',
      svgIcon: 'iconify'
    },
    {
      id: 'google-fonts',
      name: 'Google Fonts',
      category: 'Tipografía Fase 3',
      description: 'Prueba combinaciones tipográficas en vivo con carga dinámica, análisis morfológico y cálculo de tracking óptico.',
      badge: 'Vista Previa Real',
      exampleOutput: 'Inter (Headings) + JetBrains Mono (UI / Code)',
      svgIcon: 'fonts'
    },
    {
      id: 'wcag',
      name: 'Estándar WCAG 2.2',
      category: 'Accesibilidad Integrada',
      description: 'Verificación instantánea de ratios de contraste AA y AAA sobre cada par de texto y superficie de tu paleta.',
      badge: 'Ratio ≥ 7.0:1 AAA',
      exampleOutput: 'Texto #F8FAFC sobre #090D16 → 18.1:1 (AAA Aprobado)',
      svgIcon: 'wcag'
    },
    {
      id: 'visawi-web',
      name: 'Encuesta Pública VisAWI',
      category: 'Evaluación Fase 5',
      description: 'Comparte un enlace público con usuarios reales para recolectar métricas psicométricas sin que necesiten cuenta.',
      badge: 'Link Compartible',
      exampleOutput: '/survey/visawi/:projectId → Score global en tiempo real',
      svgIcon: 'survey'
    }
  ];

  // -------------------------------------------------------------
  // DOCUMENTACIÓN Y GUÍAS DE BUENAS PRÁCTICAS (5 FASES)
  // -------------------------------------------------------------
  readonly docGuides: DocGuide[] = [
    {
      id: 'fase-1-investigation',
      phaseNumber: 1,
      title: 'Guía Fase 1: Investigación y Expectativas Estéticas',
      category: 'Fase 1 · Investigación',
      readTime: '4 min de lectura',
      badge: 'Buenas Prácticas',
      description: 'Cómo levantar necesidades reales, definir perfiles de usuario y establecer referentes visuales claros antes de diseñar.',
      rulePreview: 'Entradas: Necesidad + Usuarios + Expectativas + Referencias',
      path: '#fases'
    },
    {
      id: 'fase-2-conceptual',
      phaseNumber: 2,
      title: 'Guía Fase 2: Arquitectura de Información y Wireframes',
      category: 'Fase 2 · Diseño Conceptual',
      readTime: '5 min de lectura',
      badge: 'Estructura Lo-Fi',
      description: 'Buenas prácticas para jerarquizar contenidos, diseñar flujos de navegación limpios y validar checklists conceptuales.',
      rulePreview: 'Checklist: Jerarquía clara → Flujos sin fricción → Wireframes Lo-Fi',
      path: '#fases'
    },
    {
      id: 'fase-3-visual',
      phaseNumber: 3,
      title: 'Guía Fase 3: Regla 60-30-10, WCAG 2.2 y Tipografía Modular',
      category: 'Fase 3 · Diseño Visual',
      readTime: '6 min de lectura',
      badge: 'Sistema Visual',
      description: 'Fundamentos del motor visual: escalas tonales 50–900, contraste AA/AAA, afinidad tipográfica (Choi & Hyun 2024) y exportación de tokens.',
      rulePreview: 'Regla 60% Dominante · 30% Secundario · 10% Acento + Contraste AAA',
      path: '#code-previews'
    },
    {
      id: 'fase-4-detailed',
      phaseNumber: 4,
      title: 'Guía Fase 4: Control de Consistencia en Prototipos Hi-Fi',
      category: 'Fase 4 · Diseño Detallado',
      readTime: '4 min de lectura',
      badge: 'Alta Fidelidad',
      description: 'Cómo auditar tus pantallas de alta fidelidad contra tu BrandBook para eliminar colores, fuentes o espaciados inconsistentes.',
      rulePreview: 'Verificación: Colores + Tipografía + Iconografía + Alineación',
      path: '#fases'
    },
    {
      id: 'fase-5-visawi-calista',
      phaseNumber: 5,
      title: 'Guía Fase 5: VisAWI, Modelo Calista AI y Topología Gestalt',
      category: 'Fase 5 · Evaluación Estética',
      readTime: '8 min de lectura',
      badge: 'Validación Científica',
      description: 'Interpretación de las 4 dimensiones VisAWI, scores de balance visual del modelo Calista (Delitzas 2023) y diagramas TDA (0-PD / 1-PD).',
      rulePreview: 'VisAWI (1–7) · Calista AI (0–100) · Gestalt TDA (Ciclos H1)',
      path: '#code-previews'
    },
    {
      id: 'handoff-tokens',
      title: 'Guía de Exportación: De STYLE a tu Código Frontend',
      category: 'Handoff para Devs',
      readTime: '3 min de lectura',
      badge: 'CSS / Tailwind / SCSS',
      description: 'Cómo copiar o descargar tus tokens desde el BrandBook Showcase e integrarlos en Angular, React, Vue o HTML puro sin dependencias.',
      rulePreview: 'Exportar → tokens.css | tailwind.config.js | _tokens.scss | dtcg.json',
      path: '#code-previews'
    }
  ];

  // Switch exported snippet tab
  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  // Select framework phase
  setPhase(phaseNumber: number) {
    this.selectedPhase.set(phaseNumber);
  }

  // Copy active code snippet
  copyActiveSnippet() {
    const active = this.codeSnippets[this.activeTab()];
    if (active && navigator?.clipboard) {
      navigator.clipboard.writeText(active.code);
      this.copiedSnippet.set(active.id);
      setTimeout(() => {
        this.copiedSnippet.set(null);
      }, 2000);
    }
  }

  // Copy integration snippet inside modal
  copyIntegrationExample(text: string) {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      this.copiedIntegration.set(true);
      setTimeout(() => {
        this.copiedIntegration.set(false);
      }, 1800);
    }
  }

  // Simulate aesthetic report refresh
  runReportPreview() {
    this.setActiveTab('report');
    this.isSimulating.set(true);
    setTimeout(() => {
      this.isSimulating.set(false);
    }, 900);
  }

  // Open integration detail modal
  selectIntegration(item: Integration) {
    this.copiedIntegration.set(false);
    this.activeIntegration.set(item);
  }

  closeIntegrationModal() {
    this.activeIntegration.set(null);
  }

  // Filter documentation guides
  filteredDocGuides(): DocGuide[] {
    const q = this.docsFilter().toLowerCase().trim();
    if (!q) return this.docGuides;
    return this.docGuides.filter(d =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.badge.toLowerCase().includes(q) ||
      d.rulePreview.toLowerCase().includes(q)
    );
  }
}
