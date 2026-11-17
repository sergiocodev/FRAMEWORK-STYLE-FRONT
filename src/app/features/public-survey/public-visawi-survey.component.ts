import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { AssessmentService } from '../framework/services/assessment.service';
import { environment } from '../../../environments/environment';
import {
  VisawiPublicSurveyInfo,
  VisawiPublicScreenItem,
  VisawiPublicSubmissionResponse,
  VisawiQuestionnaireItem,
  VisawiEncuestaRespuestaInput
} from '../../models/assessment.model';

@Component({
  selector: 'app-public-visawi-survey',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './public-visawi-survey.component.html',
  styleUrl: './public-visawi-survey.component.scss'
})
export class PublicVisawiSurveyComponent implements OnInit, OnDestroy {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private assessmentService: AssessmentService = inject(AssessmentService);

  projectId: number = 0;
  surveyIdentifier: string = '';
  surveyInfo: VisawiPublicSurveyInfo | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  isSurveyClosed: boolean = false;
  closedMessage: string = '';

  // Screen viewer
  selectedScreenId: number | null = null;
  viewerMode: 'contain' | 'width' = 'contain';
  isZoomModalOpen: boolean = false;

  // Answers: 18 items (key: 1..18, value: 1..7)
  answers: Record<number, number> = {};

  // Horizontal Stepper por Dimensiones y Reactivos
  currentDimensionIndex: number = 0;
  currentQuestionIndex: number = 0;
  questionViewMode: 'single' | 'compact' = 'single';
  private autoAdvanceTimer: any = null;

  // Submission state
  isSubmitting: boolean = false;
  isSubmitted: boolean = false;
  submissionResult: VisawiPublicSubmissionResponse | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const idParam = params.get('projectId') || params.get('id');
      if (idParam) {
        this.surveyIdentifier = idParam;
        const num = Number(idParam);
        if (!isNaN(num)) {
          this.projectId = num;
        }
        this.loadSurveyData();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Identificador o token de evaluación no especificado en el enlace.';
      }
    });
  }

  ngOnDestroy(): void {
    this.clearAutoAdvance();
  }

  clearAutoAdvance(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  loadSurveyData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    const identifier = this.surveyIdentifier || this.projectId;
    this.assessmentService.getPublicVisawiSurvey(identifier).subscribe({
      next: (data: VisawiPublicSurveyInfo) => {
        this.surveyInfo = data;
        this.projectId = data.proyecto_id;
        this.isLoading = false;
        if (data.encuesta_activa === false) {
          this.isSurveyClosed = true;
          this.closedMessage = data.mensaje_cierre || 'La recepción de respuestas para este proyecto está cerrada temporal o definitivamente por el equipo de diseño.';
        } else {
          this.isSurveyClosed = false;
          if (data.pantallas && data.pantallas.length > 0) {
            this.selectedScreenId = data.pantallas[0].id;
          }
        }
      },
      error: (err: any) => {
        console.error('Error al cargar la encuesta pública VisAWI:', err);
        this.isLoading = false;
        if (err.status === 403) {
          this.isSurveyClosed = true;
          this.closedMessage = err.error?.detail || 'Este cuestionario está cerrado y ya no admite nuevas respuestas.';
        } else {
          this.errorMessage = 'No se pudo cargar la evaluación. Verifica que el enlace sea correcto y que el servidor esté activo.';
        }
      }
    });
  }

  get selectedScreen(): VisawiPublicScreenItem | null {
    if (!this.surveyInfo?.pantallas || this.surveyInfo.pantallas.length === 0) {
      return null;
    }
    if (!this.selectedScreenId) {
      return this.surveyInfo.pantallas[0];
    }
    return this.surveyInfo.pantallas.find(p => p.id === this.selectedScreenId) || this.surveyInfo.pantallas[0];
  }

  onScreenChange(screenId: any): void {
    this.selectedScreenId = Number(screenId);
  }

  setViewerMode(mode: 'contain' | 'width'): void {
    this.viewerMode = mode;
  }

  toggleZoomModal(open: boolean): void {
    this.isZoomModalOpen = open;
  }

  getImageUrl(url?: string | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${environment.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  getItemsByDimension(dimName: string): VisawiQuestionnaireItem[] {
    if (!this.surveyInfo?.items) return [];
    return this.surveyInfo.items.filter(i => i.dimension.toLowerCase() === dimName.toLowerCase());
  }

  get currentDimension(): any | null {
    if (!this.surveyInfo?.dimensiones?.length) return null;
    return this.surveyInfo.dimensiones[this.currentDimensionIndex] || this.surveyInfo.dimensiones[0];
  }

  get currentDimensionItems(): VisawiQuestionnaireItem[] {
    if (!this.currentDimension) return [];
    return this.getItemsByDimension(this.currentDimension.nombre);
  }

  get currentQuestion(): VisawiQuestionnaireItem | null {
    const items = this.currentDimensionItems;
    if (!items.length) return null;
    if (this.currentQuestionIndex >= items.length) {
      this.currentQuestionIndex = 0;
    }
    return items[this.currentQuestionIndex];
  }

  isDimensionComplete(dimName: string): boolean {
    const items = this.getItemsByDimension(dimName);
    if (!items.length) return false;
    return items.every(it => this.answers[it.id] !== undefined && this.answers[it.id] !== null);
  }

  getDimensionAnsweredCount(dimName: string): number {
    const items = this.getItemsByDimension(dimName);
    return items.filter(it => this.answers[it.id] !== undefined && this.answers[it.id] !== null).length;
  }

  get nextDimensionName(): string {
    if (this.surveyInfo?.dimensiones && this.currentDimensionIndex + 1 < this.surveyInfo.dimensiones.length) {
      return this.surveyInfo.dimensiones[this.currentDimensionIndex + 1].nombre;
    }
    return 'Final';
  }

  goToDimension(index: number): void {
    this.clearAutoAdvance();
    if (index >= 0 && index < (this.surveyInfo?.dimensiones?.length || 4)) {
      this.currentDimensionIndex = index;
      this.currentQuestionIndex = 0;
    }
  }

  goToQuestion(idx: number): void {
    this.clearAutoAdvance();
    if (idx >= 0 && idx < this.currentDimensionItems.length) {
      this.currentQuestionIndex = idx;
    }
  }

  nextQuestion(): void {
    this.clearAutoAdvance();
    if (this.currentQuestionIndex < this.currentDimensionItems.length - 1) {
      this.currentQuestionIndex++;
    } else if (this.currentDimensionIndex < (this.surveyInfo?.dimensiones?.length || 4) - 1) {
      this.currentDimensionIndex++;
      this.currentQuestionIndex = 0;
    }
  }

  prevQuestion(): void {
    this.clearAutoAdvance();
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    } else if (this.currentDimensionIndex > 0) {
      this.currentDimensionIndex--;
      this.currentQuestionIndex = this.currentDimensionItems.length - 1;
    }
  }

  nextDimension(): void {
    this.clearAutoAdvance();
    if (this.currentDimensionIndex < (this.surveyInfo?.dimensiones?.length || 4) - 1) {
      this.currentDimensionIndex++;
      this.currentQuestionIndex = 0;
    }
  }

  prevDimension(): void {
    this.clearAutoAdvance();
    if (this.currentDimensionIndex > 0) {
      this.currentDimensionIndex--;
      this.currentQuestionIndex = 0;
    }
  }

  selectAnswer(itemId: number, value: number, autoAdvance: boolean = true): void {
    this.answers[itemId] = value;
    this.clearAutoAdvance();

    if (autoAdvance && this.questionViewMode === 'single') {
      const isLastItemOfSurvey = this.currentDimensionIndex === (this.surveyInfo?.dimensiones?.length || 4) - 1
        && this.currentQuestionIndex === this.currentDimensionItems.length - 1;
      if (!isLastItemOfSurvey) {
        this.autoAdvanceTimer = setTimeout(() => {
          this.nextQuestion();
        }, 280);
      }
    }
  }

  get totalAnsweredCount(): number {
    if (!this.surveyInfo?.items) return 0;
    return this.surveyInfo.items.filter(it => this.answers[it.id] !== undefined && this.answers[it.id] !== null).length;
  }

  get progressPercentage(): number {
    const total = this.surveyInfo?.items?.length || 18;
    return Math.round((this.totalAnsweredCount / total) * 100);
  }

  // Cálculos en vivo con inversión psicométrica oficial (Moshagen & Thielsch, 2010)
  calculateLiveDimensionScore(dimension: string): number {
    const items = this.getItemsByDimension(dimension);
    if (!items.length) return 0;
    const answered = items.filter(it => this.answers[it.id] !== undefined && this.answers[it.id] !== null);
    if (!answered.length) return 0;
    let sum = 0;
    for (const it of answered) {
      const raw = this.answers[it.id];
      const score = it.inverso ? (8 - raw) : raw;
      sum += score;
    }
    return Number((sum / answered.length).toFixed(1));
  }

  get liveSimplicidad(): number {
    return this.calculateLiveDimensionScore('Simplicidad');
  }

  get liveClaridad(): number {
    return this.calculateLiveDimensionScore('Claridad');
  }

  get liveDiversidad(): number {
    return this.calculateLiveDimensionScore('Diversidad');
  }

  get liveArmonia(): number {
    return this.calculateLiveDimensionScore('Armonía');
  }

  get liveGlobalScore(): number {
    if (this.totalAnsweredCount === 0) return 0;
    const s = this.liveSimplicidad;
    const c = this.liveClaridad;
    const d = this.liveDiversidad;
    const a = this.liveArmonia;
    const scores = [s, c, d, a].filter(v => v > 0);
    if (!scores.length) return 0;
    return Number((scores.reduce((acc, curr) => acc + curr, 0) / scores.length).toFixed(1));
  }

  submitSurvey(): void {
    if (this.isSubmitting) return;

    if (this.totalAnsweredCount < 18) {
      alert(`Por favor responde los 18 reactivos antes de enviar. Has respondido ${this.totalAnsweredCount} de 18.`);
      this.scrollToFirstUnanswered();
      return;
    }

    this.isSubmitting = true;
    const payload: VisawiEncuestaRespuestaInput = {
      evaluador_nombre: 'Participante Anónimo',
      evaluador_rol: 'Participante Anónimo',
      respuestas: this.answers
    };

    this.assessmentService.submitPublicVisawiSurvey(this.surveyIdentifier || this.projectId, payload).subscribe({
      next: (response: VisawiPublicSubmissionResponse) => {
        this.submissionResult = response;
        this.isSubmitting = false;
        this.isSubmitted = true;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err: any) => {
        console.error('Error al enviar respuestas:', err);
        this.isSubmitting = false;
        if (err.status === 403) {
          this.isSurveyClosed = true;
          this.closedMessage = err.error?.detail || 'El cuestionario ha sido cerrado y ya no acepta respuestas.';
        } else {
          alert('Ocurrió un error al enviar tu evaluación. Por favor intenta nuevamente.');
        }
      }
    });
  }

  scrollToFirstUnanswered(): void {
    if (!this.surveyInfo?.items || !this.surveyInfo?.dimensiones) return;
    const firstMissing = this.surveyInfo.items.find(it => !this.answers[it.id]);
    if (firstMissing) {
      const dimIndex = this.surveyInfo.dimensiones.findIndex(d => d.nombre.toLowerCase() === firstMissing.dimension.toLowerCase());
      if (dimIndex !== -1) {
        this.currentDimensionIndex = dimIndex;
        const dimItems = this.getItemsByDimension(this.surveyInfo.dimensiones[dimIndex].nombre);
        const qIdx = dimItems.findIndex(it => it.id === firstMissing.id);
        if (qIdx !== -1) {
          this.currentQuestionIndex = qIdx;
        }
      }
      setTimeout(() => {
        const el = document.getElementById('question-item-' + firstMissing.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('border-warning');
          setTimeout(() => el.classList.remove('border-warning'), 2500);
        }
      }, 150);
    }
  }

  restartSurvey(): void {
    this.answers = {};
    this.isSubmitted = false;
    this.submissionResult = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
