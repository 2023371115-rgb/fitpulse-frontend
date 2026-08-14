import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FileMetadata } from '../files.service';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

interface DeviceEntry {
  id: string;
  name: string;
  type: 'smarttv' | 'wearable' | 'phone' | 'other';
  status: 'idle' | 'pairing' | 'linked' | 'error' | 'offline';
  token?: string;
}

interface LatestMetric {
  heart_rate: number | null;
  steps: number | null;
  spo2: number | null;
  temperature: number | null;
  recorded_at: string;
}

@Component({
  selector: 'app-device-panel',
  templateUrl: './device-panel.component.html',
  styleUrls: ['./device-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DevicePanelComponent implements OnChanges, OnDestroy, OnInit {
  /** Lista de archivos actuales del Sketchbook, usada para calcular estadísticas */
  @Input() files: FileMetadata[] = [];

  // --- estadísticas ---
  totalFiles = 0;
  totalSize = '';
  imageCount = 0;
  videoCount = 0;
  otherCount = 0;

  // --- dispositivos ---
  devices: DeviceEntry[] = [];
  selectedDeviceId: string | null = null;
  pairingLog: string[] = [];
  panelOpen = false;
  latestMetrics: { [deviceId: string]: LatestMetric } = {};
  pairingCode = '';
  pairingCodeDevice = '';
  pairingExpiresAt = '';
  generatingCode = false;

  private base = `${environment.apiUrl}/devices`;
  private poll?: number;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
    this.poll = window.setInterval(() => {
      if (this.auth.getToken()) this.loadDevices(false);
    }, 3500);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files']) this.calcStats();
  }

  ngOnDestroy(): void {
    if (this.poll) window.clearInterval(this.poll);
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` });
  }

  loadDevices(showErrors = true): void {
    this.http.get<DeviceEntry[]>(this.base, { headers: this.headers() }).subscribe({
      next: devs => {
        this.devices = devs;
        if ((!this.selectedDeviceId || !devs.some(d => d.id === this.selectedDeviceId)) && devs.length) {
          this.selectedDeviceId = devs[0].id;
        }
        this.cdr.markForCheck();
        devs.forEach(d => this.loadLatestMetric(d.id));
      },
      error: () => {
        if (showErrors) this.pairingLog.unshift(`[${this.now()}] Error al cargar dispositivos`);
        this.cdr.markForCheck();
      }
    });
  }

  loadLatestMetric(deviceId: string): void {
    this.http
      .get<LatestMetric | null>(`${this.base}/${deviceId}/metrics/latest`, { headers: this.headers() })
      .subscribe({
        next: m => {
          if (m) {
            this.latestMetrics[deviceId] = m;
          } else {
            delete this.latestMetrics[deviceId];
          }
          this.cdr.markForCheck();
        }
      });
  }

  togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    if (this.panelOpen) this.loadDevices(false);
  }

  private calcStats(): void {
    this.totalFiles = this.files.length;
    const totalBytes = this.files.reduce((s, f) => s + (f.size ?? 0), 0);
    this.totalSize = this.formatBytes(totalBytes);
    this.imageCount = this.files.filter(f => f.mime_type?.startsWith('image')).length;
    this.videoCount = this.files.filter(f => f.mime_type?.startsWith('video')).length;
    this.otherCount = this.totalFiles - this.imageCount - this.videoCount;
  }

  get selectedDevice(): DeviceEntry | null {
    return this.devices.find(d => d.id === this.selectedDeviceId) ?? null;
  }

  get linkedCount(): number {
    return this.devices.filter(d => d.status === 'linked').length;
  }

  get wearableCount(): number {
    return this.devices.filter(d => d.type === 'wearable').length;
  }

  get tvCount(): number {
    return this.devices.filter(d => d.type === 'smarttv').length;
  }

  get phoneCount(): number {
    return this.devices.filter(d => d.type === 'phone').length;
  }

  registerDevice(type: DeviceEntry['type']): void {
    const names: Record<DeviceEntry['type'], string> = {
      wearable: 'FitPulse Wear OS',
      smarttv: 'FitPulse Smart TV',
      phone: 'Telefono FitPulse',
      other: 'Dispositivo FitPulse'
    };

    this.http.post<DeviceEntry>(this.base, { name: names[type], type }, { headers: this.headers() }).subscribe({
      next: dev => {
        this.devices = [dev, ...this.devices];
        this.selectedDeviceId = dev.id;
        this.pairingLog.unshift(`[${this.now()}] ${dev.name} registrado`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.pairingLog.unshift(`[${this.now()}] Error al registrar dispositivo`);
        this.cdr.markForCheck();
      }
    });
  }

  async pairDevice(): Promise<void> {
    if (!this.selectedDevice) return;
    const dev = this.selectedDevice;
    dev.status = 'pairing';
    this.pairingLog.unshift(`[${this.now()}] Iniciando enlace con "${dev.name}"...`);
    this.cdr.markForCheck();

    this.http
      .patch(`${this.base}/${dev.id}/status`, { status: 'linked' }, { headers: this.headers() })
      .subscribe({
        next: () => {
          dev.status = 'linked';
          this.pairingLog.unshift(`[${this.now()}] "${dev.name}" enlazado`);
          this.loadLatestMetric(dev.id);
          this.cdr.markForCheck();
        },
        error: () => {
          dev.status = 'error';
          this.pairingLog.unshift(`[${this.now()}] Error al enlazar "${dev.name}"`);
          this.cdr.markForCheck();
        }
      });
  }

  generateWearCode(dev: DeviceEntry): void {
    this.generatingCode = true;
    this.pairingCode = '';
    this.pairingCodeDevice = dev.name;
    this.pairingExpiresAt = '';
    this.cdr.markForCheck();

    this.http
      .post<{ code: string; expiresAt: string }>(`${this.base}/${dev.id}/pairing-code`, {}, { headers: this.headers() })
      .subscribe({
        next: res => {
          this.pairingCode = res.code;
          this.pairingExpiresAt = new Date(res.expiresAt).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
          });
          this.pairingLog.unshift(`[${this.now()}] Codigo ${res.code} generado para ${dev.name}`);
          this.generatingCode = false;
          this.selectedDeviceId = dev.id;
          this.loadDevices(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.pairingLog.unshift(`[${this.now()}] Error al generar codigo para reloj`);
          this.generatingCode = false;
          this.cdr.markForCheck();
        }
      });
  }

  unlinkDevice(dev: DeviceEntry): void {
    this.http
      .patch(`${this.base}/${dev.id}/status`, { status: 'idle' }, { headers: this.headers() })
      .subscribe({
        next: () => {
          dev.status = 'idle';
          this.pairingLog.unshift(`[${this.now()}] Enlace con "${dev.name}" eliminado`);
          this.cdr.markForCheck();
        }
      });
  }

  deleteDevice(dev: DeviceEntry): void {
    const ok = window.confirm(`Eliminar "${dev.name}" y sus metricas registradas?`);
    if (!ok) return;

    this.http.delete(`${this.base}/${dev.id}`, { headers: this.headers() }).subscribe({
      next: () => {
        this.devices = this.devices.filter(d => d.id !== dev.id);
        delete this.latestMetrics[dev.id];
        if (this.selectedDeviceId === dev.id) {
          this.selectedDeviceId = this.devices[0]?.id ?? null;
        }
        if (this.pairingCodeDevice === dev.name) {
          this.pairingCode = '';
          this.pairingCodeDevice = '';
          this.pairingExpiresAt = '';
        }
        this.pairingLog.unshift(`[${this.now()}] "${dev.name}" eliminado`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.pairingLog.unshift(`[${this.now()}] Error al eliminar "${dev.name}"`);
        this.cdr.markForCheck();
      }
    });
  }

  trackById(_: number, d: DeviceEntry) { return d.id; }

  private now(): string {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  }
}

