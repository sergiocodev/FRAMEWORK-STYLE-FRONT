import { Injectable, signal } from '@angular/core';

export type DialogType = 'danger' | 'warning' | 'success' | 'info';

export interface DialogOptions {
  title?: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogInternalState extends DialogOptions {
  isOpen: boolean;
  isConfirm: boolean;
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  state = signal<DialogInternalState | null>(null);

  /**
   * Muestra un modal de confirmación con dos botones (Confirmar / Cancelar).
   * Retorna una promesa que resuelve en true (confirmado) o false (cancelado).
   */
  confirm(options: DialogOptions | string): Promise<boolean> {
    const opts: DialogOptions = typeof options === 'string'
      ? {
          title: 'Confirmar Acción',
          message: options,
          type: 'danger',
          confirmText: 'Confirmar',
          cancelText: 'Cancelar'
        }
      : {
          title: options.title || 'Confirmar Acción',
          message: options.message,
          type: options.type || 'danger',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar'
        };

    return new Promise<boolean>((resolve) => {
      this.state.set({
        ...opts,
        isOpen: true,
        isConfirm: true,
        resolve
      });
    });
  }

  /**
   * Muestra un modal informativo/alerta con un único botón para cerrar.
   * Retorna una promesa que resuelve al cerrar el modal.
   */
  alert(options: DialogOptions | string): Promise<void> {
    const opts: DialogOptions = typeof options === 'string'
      ? {
          title: 'Aviso del Sistema',
          message: options,
          type: 'info',
          confirmText: 'Entendido'
        }
      : {
          title: options.title || 'Aviso del Sistema',
          message: options.message,
          type: options.type || 'info',
          confirmText: options.confirmText || 'Entendido'
        };

    return new Promise<void>((resolve) => {
      this.state.set({
        ...opts,
        isOpen: true,
        isConfirm: false,
        resolve: () => resolve()
      });
    });
  }

  success(message: string, title = 'Operación Exitosa'): Promise<void> {
    return this.alert({ message, title, type: 'success' });
  }

  error(message: string, title = 'Error en el Sistema'): Promise<void> {
    return this.alert({ message, title, type: 'danger' });
  }

  warning(message: string, title = 'Advertencia'): Promise<void> {
    return this.alert({ message, title, type: 'warning' });
  }

  info(message: string, title = 'Información'): Promise<void> {
    return this.alert({ message, title, type: 'info' });
  }

  close(result: boolean) {
    const current = this.state();
    if (current) {
      this.state.set(null);
      current.resolve(result);
    }
  }
}
