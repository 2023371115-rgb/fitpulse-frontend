import { Component, Input, HostListener, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FilesService, FileMetadata, ExternalSearchResult } from '../files.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-virtual-folder',
  templateUrl: './virtual-folder.component.html',
  styleUrls: ['./virtual-folder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VirtualFolderComponent implements OnInit {
  constructor(private filesService: FilesService, private cdr: ChangeDetectorRef) {}

  /** trackBy para *ngFor — evita re-render completo al refrescar la lista */
  trackById(_index: number, file: FileMetadata): string {
    return file.id ?? file.filename ?? String(_index);
  }
  @Input() workspaceId: string = 'default';
  private apiBase = environment.apiUrl.replace(/\/api$/,'');

  files: FileMetadata[] = [];
  isMobile = false;
  preview: { url: string | null, type: string | null } | null = null;
  notificationsEnabled = false;
  searchActive = false;
  externalResults: ExternalSearchResult[] = [];
  externalMode = false;
  externalError: string | null = null;

  ngOnInit(): void {
    this.notificationsEnabled = ('serviceWorker' in navigator) && ('Notification' in window);
    this.checkSize();
    this.loadFiles();
  }

  @HostListener('window:resize') checkSize() {
    this.isMobile = window.innerWidth < 700;
  }

  loadFiles(){
    this.searchActive = false;
    this.externalResults = [];
    this.externalMode = false;
    this.externalError = null;
    this.filesService.getFilesByWorkspace(this.workspaceId).subscribe({
      next: data => { this.files = data; this.cdr.markForCheck(); },
      error: err => console.error('Error loading files', err)
    });
  }

  searchFiles(query: string, mode: 'internal' | 'external' = 'internal', externalType: 'web' | 'image' = 'web'): void {
    const trimmed = query.trim();
    if (!trimmed) {
      this.loadFiles();
      return;
    }

    this.externalMode = mode === 'external';
    this.searchActive = true;

    if (this.externalMode) {
      this.externalResults = [];
      this.files = [];
      this.externalError = null;
      this.filesService.externalSearch(trimmed, externalType).subscribe({
        next: data => {
          this.externalResults = data;
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('External search error', err);
          this.externalError = err?.error?.details || err?.message || 'Error en búsqueda externa';
          this.externalResults = [];
          this.cdr.markForCheck();
        }
      });
      return;
    }

    this.filesService.searchFiles(this.workspaceId, trimmed).subscribe({
      next: data => {
        this.files = data;
        this.cdr.markForCheck();
      },
      error: err => console.error('Search error', err)
    });
  }

  clearSearch(): void {
    this.searchActive = false;
    this.loadFiles();
  }

  openPreview(file: FileMetadata){
    if(file.thumbnail_url) this.preview = { url: this.toAssetUrl(file.thumbnail_url), type: file.mime_type || null };
    else if(file.storage_path) this.preview = { url: this.toAssetUrl(file.storage_path), type: file.mime_type || null };
  }

  closePreview(){ this.preview = null; }

  toAssetUrl(url?: string | null): string | null {
    if(!url) return null;
    if(url.startsWith('http')) return url;
    return `${this.apiBase}${url}`;
  }

  // Convierte bytes crudos a formatos legibles (KB, MB, GB)
  formatBytes(bytes: number | undefined, decimals = 2) {
    if (bytes == null) return '';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Extrae una extensión corta si no hay miniatura (ej. "video/mp4" -> "MP4")
  getFileExtension(mimeType?: string): string {
    if (!mimeType) return 'DOC';
    const parts = mimeType.split('/');
    return parts[1] ? parts[1].toUpperCase() : parts[0].toUpperCase();
  }

  // PWA Notification helpers (simulation)
  requestNotificationPermission(): void {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      alert('Las notificaciones no están soportadas en el navegador de este dispositivo.');
      return;
    }

    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        this.showSimulationNotification('¡Suscripción Exitosa!', 'Ahora recibirás alertas sobre el estado de tus archivos.');
      }
    });
  }

  showSimulationNotification(title: string, body: string): void {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body: body,
          icon: 'assets/icons/icon-192x192.png',
          vibrate: [200, 100, 200],
          badge: 'assets/icons/icon-192x192.png'
        });
      });
    } else {
      console.log(`Notification Fallback: ${title} - ${body}`);
    }
  }
}
