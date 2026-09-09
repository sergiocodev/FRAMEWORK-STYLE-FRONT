import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-investigation-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './investigation-preview.component.html',
  styleUrls: ['./investigation-preview.component.scss']
})
export class InvestigationPreviewComponent implements OnChanges {
  @Input() project: any;
  @Input() necesidad: string = '';
  @Input() usuarios: any[] = [];
  @Input() recursos: any[] = [];

  safeMarkdown: SafeHtml = '';
  private sanitizer = inject(DomSanitizer);

  ngOnChanges(changes: SimpleChanges): void {
    this.updatePreview();
  }

  private async updatePreview() {
    const markdownString = this.generateMarkdown();
    // Parse markdown to HTML asynchronously (marked.parse can return string or Promise depending on config, but by default string)
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
      <p class="text-secondary mb-0" style="font-size: 0.7rem; line-height: 1.2;">Framework de Diseño y Mejora<br>de Interfaces de Usuario</p>
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

<h6 class="fw-bold mb-3 fs-6" style="color: #1e293b;">1. Resumen del proyecto</h6>
<p class="mb-4 text-secondary" style="font-size: 0.9rem; line-height: 1.6;">El presente informe recopila la información inicial del proyecto ${this.project?.title || 'Sin nombre'}, con el objetivo de comprender la necesidad del cliente, identificar a los usuarios y analizar los recursos disponibles para el desarrollo de una solución digital que mejore la experiencia.</p>

<h6 class="fw-bold mb-3 fs-6" style="color: #1e293b;">2. Necesidad del proyecto</h6>
<p class="mb-4 text-secondary" style="font-size: 0.9rem; line-height: 1.6; white-space: pre-wrap;">${this.necesidad || '*Sin especificar*'}</p>

<h6 class="fw-bold mb-4 fs-6" style="color: #1e293b;">3. Usuarios (Arquetipos)</h6>
<div class="row g-3 mb-5">
`;

    if (this.usuarios && this.usuarios.length > 0) {
      for (const user of this.usuarios) {
        let needsList = user.needs ? user.needs.map((n: string) => `<li class="text-secondary mb-2 d-flex gap-2" style="font-size: 0.75rem; line-height: 1.4;"><span class="text-primary mt-1" style="font-size: 0.5rem;">●</span> <span>${n}</span></li>`).join('') : '';
        md += `
  <div class="col-12 col-md-6 col-lg-4" style="page-break-inside: avoid;">
    <div class="border rounded-3 p-3 h-100">
      <div class="d-flex align-items-center gap-2 mb-3">
        <img src="${user.photoUrl}" class="rounded-circle border" width="36" height="36" alt="Avatar">
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

<h6 class="fw-bold mb-4 fs-6" style="color: #1e293b;">4. Recursos</h6>
<div class="d-flex flex-column gap-3 mb-5">
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
  <div class="d-flex align-items-center gap-4 border p-2 rounded-3 mb-2">
    <div class="d-flex align-items-center justify-content-center bg-light rounded-3 text-secondary border flex-shrink-0" style="width: 40px; height: 40px;">
      ${icon}
    </div>
    <div style="min-width: 180px;">
      <h6 class="text-dark fw-bold mb-0" style="font-size: 0.8rem;">${file.name}</h6>
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
<div class="mt-5 pt-4 border-top d-flex justify-content-between align-items-center text-secondary" style="font-size: 0.7rem;">
  <div><span class="fw-bold">STYLE</span> - Framework de Diseño y Mejora de Interfaces de Usuario</div>
  <div>Página 1 de 1</div>
</div>
`;

    return md;
  }
}
