import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-investigation-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investigation-preview.component.html',
  styleUrls: ['./investigation-preview.component.scss']
})
export class InvestigationPreviewComponent implements OnChanges {
  @Input() project: any;

  // Phase 1 Data
  @Input() problema: string = '';
  @Input() objetivo: string = '';
  @Input() producto: string = '';

  @Input() expectativas: string = '';
  @Input() referencias: { url: string, notas: string }[] = [];
  @Input() analisisActual: string = '';

  @Input() usuarios: any[] = [];

  @Input() recursos: any[] = [];
  @Input() restricciones: string = '';
  @Input() identidadMarca: { tieneManual: boolean, colores: string, notas: string } = { tieneManual: false, colores: '', notas: '' };

  safeMarkdown: SafeHtml = '';
  copySuccess: boolean = false;
  private sanitizer = inject(DomSanitizer);

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.apiUrl}${url}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePreview();
  }

  private async updatePreview() {
    const markdownString = this.generateMarkdown();
    const rawHtml = await marked.parse(markdownString);
    this.safeMarkdown = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  copyMarkdown() {
    const raw = this.generateMarkdown();
    navigator.clipboard.writeText(raw).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2500);
    });
  }

  printDocument() {
    window.print();
  }

  private generateMarkdown(): string {
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    let usersHtml = '';
    if (this.usuarios && this.usuarios.length > 0) {
      usersHtml = this.usuarios.map(u => `
<div class="user-preview-card p-3 rounded-3 border bg-light mb-2">
  <div class="d-flex align-items-center justify-content-between mb-1">
    <strong class="text-dark">${u.role || 'Usuario'} — ${u.name || 'Sin nombre'}</strong>
    <span class="badge bg-secondary-subtle text-secondary">${u.tag || 'General'}</span>
  </div>
  <ul class="mb-0 ps-3 small text-secondary">
    ${(u.needs || []).map((n: string) => `<li>${n}</li>`).join('')}
  </ul>
</div>
      `).join('');
    } else {
      usersHtml = '<p class="text-muted small fst-italic">No se han registrado arquetipos de usuario.</p>';
    }

    let filesHtml = '';
    if (this.recursos && this.recursos.length > 0) {
      filesHtml = `<ul class="small text-secondary mb-0">` + 
        this.recursos.map(r => `<li><strong>${r.name}</strong> (${r.size})</li>`).join('') +
        `</ul>`;
    } else {
      filesHtml = '<p class="text-muted small fst-italic">No se adjuntaron archivos adicionales.</p>';
    }

    let refsHtml = '';
    if (this.referencias && this.referencias.length > 0) {
      refsHtml = `<ul class="small text-secondary mb-0">` +
        this.referencias.map(r => `<li><a href="${this.getImageUrl(r.url)}" target="_blank">${r.url || 'Imagen adjunta'}</a> ${r.notas ? `— <em>${r.notas}</em>` : ''}</li>`).join('') +
        `</ul>`;
    } else {
      refsHtml = '<p class="text-muted small fst-italic">Sin referencias visuales registradas.</p>';
    }

    return `
<div class="doc-header d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom">
  <div class="d-flex align-items-center gap-3">
    <div class="brand-badge bg-primary text-white d-flex align-items-center justify-content-center rounded-3 fs-4 fw-bold shadow-sm" style="width: 44px; height: 44px;">
      S
    </div>
    <div>
      <h4 class="fw-bold text-dark mb-0 fs-5" style="letter-spacing: 0.5px;">STYLE Framework</h4>
      <p class="text-secondary mb-0 small">Informe de Investigación de Interfaz · Fase 1</p>
    </div>
  </div>
  <div class="text-end">
    <span class="badge bg-success-subtle text-success border-0 px-2 py-1 mb-1">Informe Oficial</span>
    <p class="text-secondary mb-0 small"><strong>Proyecto:</strong> ${this.project?.title || 'Sin nombre'}</p>
    <p class="text-secondary mb-0 small"><strong>Cliente:</strong> ${this.project?.client || 'General'}</p>
    <p class="text-muted mb-0 small" style="font-size: 0.75rem;">${date}</p>
  </div>
</div>

<div class="doc-body text-dark">

  <div class="section-block mb-4">
    <h6 class="fw-bold text-primary text-uppercase mb-2" style="font-size: 0.8rem; letter-spacing: 0.5px;">1. Comprensión del Proyecto</h6>
    <div class="p-3 rounded-3 border bg-light-subtle">
      <div class="mb-2">
        <strong class="small d-block text-dark">Problema o Necesidad:</strong>
        <p class="text-secondary mb-0 small">${this.problema || '<em>No especificado</em>'}</p>
      </div>
      <div class="mb-2">
        <strong class="small d-block text-dark">Objetivo del Proyecto:</strong>
        <p class="text-secondary mb-0 small">${this.objetivo || '<em>No especificado</em>'}</p>
      </div>
      <div>
        <strong class="small d-block text-dark">Naturaleza del Producto:</strong>
        <p class="text-secondary mb-0 small">${this.producto || '<em>No especificado</em>'}</p>
      </div>
    </div>
  </div>

  <div class="section-block mb-4">
    <h6 class="fw-bold text-primary text-uppercase mb-2" style="font-size: 0.8rem; letter-spacing: 0.5px;">2. Expectativas y Referencias</h6>
    <div class="p-3 rounded-3 border bg-light-subtle">
      <div class="mb-2">
        <strong class="small d-block text-dark">Expectativas Estéticas:</strong>
        <p class="text-secondary mb-0 small">${this.expectativas || '<em>No especificado</em>'}</p>
      </div>
      <div class="mb-2">
        <strong class="small d-block text-dark">Referencias Visuales:</strong>
        ${refsHtml}
      </div>
      <div>
        <strong class="small d-block text-dark">Diagnóstico del Estado Actual:</strong>
        <p class="text-secondary mb-0 small">${this.analisisActual || '<em>No aplica o sin registrar</em>'}</p>
      </div>
    </div>
  </div>

  <div class="section-block mb-4">
    <h6 class="fw-bold text-primary text-uppercase mb-2" style="font-size: 0.8rem; letter-spacing: 0.5px;">3. Arquetipos de Usuario</h6>
    ${usersHtml}
  </div>

  <div class="section-block mb-3">
    <h6 class="fw-bold text-primary text-uppercase mb-2" style="font-size: 0.8rem; letter-spacing: 0.5px;">4. Recursos, Restricciones y Marca</h6>
    <div class="p-3 rounded-3 border bg-light-subtle">
      <div class="mb-2">
        <strong class="small d-block text-dark">Restricciones Técnicas:</strong>
        <p class="text-secondary mb-0 small">${this.restricciones || '<em>No especificadas</em>'}</p>
      </div>
      <div class="mb-2">
        <strong class="small d-block text-dark">Identidad de Marca:</strong>
        <p class="text-secondary mb-0 small">
          Manual oficial: ${this.identidadMarca?.tieneManual ? 'Sí cuenta con manual de marca' : 'No cuenta con manual formal'}.<br>
          Colores: ${this.identidadMarca?.colores || 'Sin definir'}.<br>
          Notas: ${this.identidadMarca?.notas || 'Sin notas adicionales'}.
        </p>
      </div>
      <div>
        <strong class="small d-block text-dark">Archivos Adjuntos:</strong>
        ${filesHtml}
      </div>
    </div>
  </div>

</div>
    `;
  }
}
