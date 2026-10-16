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

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    return `${environment.apiUrl}${url}`;
  }


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
  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePreview();
  }

  private async updatePreview() {
    const markdownString = this.generateMarkdown();
    const rawHtml = await marked.parse(markdownString);
    this.safeMarkdown = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }

  private generateMarkdown(): string {
    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    let md = `
<div class="d-flex justify-content-between align-items-start mb-5 border-bottom pb-4">
  <div class="d-flex align-items-center gap-3">
    <div class="bg-primary text-white d-flex align-items-center justify-content-center rounded-3 fs-3 fw-bold shadow-sm" style="width: 48px; height: 48px;">
      S
    </div>
    <div>
      <h4 class="fw-bold text-dark mb-0 fs-5" style="letter-spacing: 1px;">STYLE</h4>
      <p class="text-secondary mb-0" style="font-size: 0.7rem; line-height: 1.2;">Framework de Diseño y Aseguramiento <br>de la estética de Interfaces de Usuario</p>
    </div>
  </div>
  <div class="text-end">
    <h5 class="fw-bold text-dark mb-2 fs-6">Informe de Investigación</h5>
    <p class="text-secondary mb-1" style="font-size: 0.8rem;"><span class="fw-bold text-dark">Proyecto:</span> ${this.project?.title || 'Sin nombre'}</p>
    <p class="text-secondary mb-1" style="font-size: 0.8rem;"><span class="fw-bold text-dark">Cliente:</span> ${this.project?.client || 'Sin cliente'}</p>
    <p class="text-secondary mb-0" style="font-size: 0.8rem;"><span class="fw-bold text-dark">Fecha:</span> ${date}</p>
  </div>
</div>

<div class="doc-content text-dark px-3">

<h6 class="fw-bold mb-3 fs-6" style="color: #1e293b;">Comprensión del proyecto</h6>
<div class="mb-4">
  <div class="mb-3">
    <span class="fw-bold" style="font-size: 0.85rem;">Problema o Necesidad:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.problema || '*Sin especificar*'}</p>
  </div>
  <div class="mb-3">
    <span class="fw-bold" style="font-size: 0.85rem;">Objetivo del Proyecto:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.objetivo || '*Sin especificar*'}</p>
  </div>
  <div>
    <span class="fw-bold" style="font-size: 0.85rem;">Descripción del Producto:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.producto || '*Sin especificar*'}</p>
  </div>
</div>

<hr class="my-4" style="opacity: 0.1;">

<h6 class="fw-bold mb-3 fs-6" style="color: #1e293b;">Expectativas y Referencias</h6>
<div class="mb-4">
  <div class="mb-3">
    <span class="fw-bold" style="font-size: 0.85rem;">Expectativas del Cliente:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.expectativas || '*Sin especificar*'}</p>
  </div>
  
  <div class="mb-3">
    <span class="fw-bold" style="font-size: 0.85rem;">Referencias (Inspiración):</span>
`;

    if (this.referencias && this.referencias.length > 0) {
      md += `<ul class="text-secondary mb-0 mt-2 d-flex flex-column gap-3" style="font-size: 0.85rem; line-height: 1.5; list-style-type: none; padding-left: 0;">`;
      for (const rawRef of this.referencias) {
        const ref = typeof rawRef === 'string' ? { url: rawRef, notas: '' } : (rawRef || { url: '', notas: '' });
        const isImage = ref.url && (ref.url.startsWith('http') || ref.url.includes('/uploads/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(ref.url));
        const fullUrl = this.getImageUrl(ref.url);
        
        md += `<li class="border p-2 rounded-2 bg-light">`;
        if (isImage) {
          md += `
            <div class="text-center bg-white rounded-2 mb-2 p-1 border" style="min-height: 50px;">
              <img src="${fullUrl}" alt="Referencia" style="max-height: 200px; object-fit: contain;" class="img-fluid rounded-1">
            </div>`;
        } else if (ref.url) {
          md += `<p class="mb-1 text-dark"><strong>Referencia:</strong> ${ref.url}</p>`;
        }
        if (ref.notas) {
          md += `<p class="mb-0 text-dark" style="font-size: 0.8rem;"><strong>Notas:</strong> ${ref.notas}</p>`;
        }
        md += `</li>`;
      }
      md += `</ul>`;
    } else {
      md += `<p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem;">*Sin referencias adjuntas*</p>`;
    }

    md += `
  </div>
  
  <div>
    <span class="fw-bold" style="font-size: 0.85rem;">Análisis de Situación Actual:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.analisisActual || '*Sin análisis previo*'}</p>
  </div>
</div>

<hr class="my-4" style="opacity: 0.1;">

<h6 class="fw-bold mb-4 fs-6" style="color: #1e293b;">Usuarios (Arquetipos)</h6>
<div class="row g-3 mb-4">
`;

    if (this.usuarios && this.usuarios.length > 0) {
      for (const user of this.usuarios) {
        let needsList = user.needs ? user.needs.map((n: string) => `<li class="text-secondary mb-2 d-flex gap-2" style="font-size: 0.75rem; line-height: 1.4;"><span class="text-primary mt-1" style="font-size: 0.5rem;">●</span> <span>${n}</span></li>`).join('') : '';
        md += `
<div class="col-12 col-md-6 col-lg-4" style="page-break-inside: avoid;">
  <div class="border rounded-3 p-3 h-100">
    <div class="d-flex align-items-center gap-2 mb-3">
      <i class="bi bi-person-circle text-secondary flex-shrink-0" style="font-size: 36px; line-height: 36px; width: 36px; height: 36px;"></i>
      <div>
        <div class="fw-bold text-dark" style="font-size: 0.8rem;">${user.role}</div>
        <div class="text-primary" style="font-size: 0.75rem; font-weight: 500;">${user.name}</div>
      </div>
    </div>
    <ul class="list-unstyled mb-0 ms-1">
      ${needsList}
    </ul>
  </div>
</div>`;
      }
    } else {
      md += `<p class="text-secondary small">*No hay usuarios definidos*</p>`;
    }

    md += `
</div>

<hr class="my-4" style="opacity: 0.1;">

<h6 class="fw-bold mb-4 fs-6" style="color: #1e293b;">Recursos y Restricciones</h6>
<div class="mb-4">
  <div class="mb-3">
    <span class="fw-bold" style="font-size: 0.85rem;">Restricciones Técnicas:</span>
    <p class="text-secondary mb-0 mt-1" style="font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap;">${this.restricciones || '*Sin restricciones*'}</p>
  </div>
  
  <div class="mb-4 p-3 bg-light rounded border">
    <span class="fw-bold d-block mb-2" style="font-size: 0.85rem;">Identidad Institucional:</span>
    <ul class="text-secondary mb-0" style="font-size: 0.85rem; line-height: 1.5; list-style-type: none; padding-left: 0;">
      <li><strong>Manual de marca:</strong> ${this.identidadMarca?.tieneManual ? 'Sí' : 'No'}</li>
      <li><strong>Colores Principales:</strong> ${this.identidadMarca?.colores || '*No especificado*'}</li>
      <li><strong>Notas adicionales:</strong> ${this.identidadMarca?.notas || '*No especificado*'}</li>
    </ul>
  </div>
  
  <span class="fw-bold d-block mb-2" style="font-size: 0.85rem;">Archivos Adjuntos:</span>
  <div class="d-flex flex-column gap-2 mb-2">
`;

    if (this.recursos && this.recursos.length > 0) {
      for (const file of this.recursos) {
        let icon = '';
        if (file.type === 'pdf') {
          icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
        } else if (file.type === 'image') {
          icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
        } else {
          icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`;
        }

        md += `
<div class="d-flex align-items-center gap-3 border p-2 rounded-2 mb-2">
  <div class="d-flex align-items-center justify-content-center bg-light rounded text-secondary border flex-shrink-0" style="width: 36px; height: 36px;">
    ${icon}
  </div>
  <div>
    <h6 class="text-dark fw-bold mb-0" style="font-size: 0.75rem;">${file.name}</h6>
    <p class="text-secondary small mb-0" style="font-size: 0.7rem;">${file.size}</p>
  </div>
</div>`;
      }
    } else {
      md += `<p class="text-secondary small">*No hay recursos adjuntos*</p>`;
    }

    md += `
  </div>
</div>

</div>
<div class="mt-5 pt-4 border-top d-flex justify-content-between align-items-center text-secondary" style="font-size: 0.7rem;">
  <div><span class="fw-bold">STYLE</span> - Framework de Diseño y Aseguramiento de la estética de Interfaces de Usuario</div>
  <div>Página 1 de 1</div>
</div>
`;

    return md;
  }
}
