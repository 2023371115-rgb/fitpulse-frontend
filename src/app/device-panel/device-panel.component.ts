import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
export class DevicePanelComponent implements OnChanges, OnInit {
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

  private base = `${environment.apiUrl}/devices`;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files']) this.calcStats();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` });
  }

  loadDevices(): void {
    this.http.get<DeviceEntry[]>(this.base, { headers: this.headers() }).subscribe({
      next: devs => {
        this.devices = devs;
        if (!this.selectedDeviceId && devs.length) {
          this.selectedDeviceId = devs[0].id;
        }
        this.cdr.markForCheck();
        devs.forEach(d => this.loadLatestMetric(d.id));
      },
      error: () => this.pairingLog.unshift(`[${this.now()}] Error al cargar dispositivos`)
    });
  }

  loadLatestMetric(deviceId: string): void {
    this.http
      .get<LatestMetric | null>(`${this.base}/${deviceId}/metrics/latest`, { headers: this.headers() })
      .subscribe({
        next: m => {
          if (m) this.latestMetrics[deviceId] = m;
          this.cdr.markForCheck();
        }
      });
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

