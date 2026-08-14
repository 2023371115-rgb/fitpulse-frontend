import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

interface DeviceEntry {
  id: string;
  name: string;
  type: 'smarttv' | 'wearable' | 'phone' | 'other';
  status: 'idle' | 'linked' | 'offline';
}

interface LatestMetric {
  heart_rate: number | null;
  steps: number | null;
  spo2: number | null;
  temperature: number | string | null;
  recorded_at: string;
}

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.scss'],
})
export class DashboardViewComponent implements OnInit, OnDestroy {
  @Input() theme?: {
    primary?: string;
    accent?: string;
    background?: string;
    surface?: string;
  };

  devices: DeviceEntry[] = [];
  latestMetric: LatestMetric | null = null;
  selectedDevice: DeviceEntry | null = null;
  loading = true;
  lastSync = '';
  private poll?: number;
  private readonly base = `${environment.apiUrl}/devices`;

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.poll = window.setInterval(() => this.loadDashboard(false), 3500);
  }

  ngOnDestroy(): void {
    if (this.poll) window.clearInterval(this.poll);
  }

  get linkedCount(): number {
    return this.devices.filter(device => device.status === 'linked').length;
  }

  get wearableCount(): number {
    return this.devices.filter(device => device.type === 'wearable').length;
  }

  get heartRate(): string {
    return this.latestMetric?.heart_rate != null ? `${this.latestMetric.heart_rate} lpm` : 'Sin dato';
  }

  get steps(): string {
    return this.latestMetric?.steps != null ? `${this.latestMetric.steps}` : 'Sin dato';
  }

  get spo2(): string {
    return this.latestMetric?.spo2 != null ? `${this.latestMetric.spo2}%` : 'Sin dato';
  }

  get temperature(): string {
    return this.latestMetric?.temperature != null ? `${this.latestMetric.temperature}°C` : 'Sin dato';
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken() ?? ''}` });
  }

  private loadDashboard(showLoader = true): void {
    if (showLoader) this.loading = true;
    this.http.get<DeviceEntry[]>(this.base, { headers: this.headers() }).subscribe({
      next: devices => {
        this.devices = devices;
        this.selectedDevice = devices.find(device => device.type === 'wearable')
          || devices.find(device => device.status === 'linked')
          || devices[0]
          || null;

        if (this.selectedDevice) {
          this.loadLatestMetric(this.selectedDevice.id);
        } else {
          this.latestMetric = null;
          this.loading = false;
          this.lastSync = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
      },
      error: () => {
        this.loading = false;
        this.latestMetric = null;
      }
    });
  }

  private loadLatestMetric(deviceId: string): void {
    this.http.get<LatestMetric | null>(`${this.base}/${deviceId}/metrics/latest`, { headers: this.headers() }).subscribe({
      next: metric => {
        this.latestMetric = metric;
        this.loading = false;
        this.lastSync = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      },
      error: () => {
        this.loading = false;
        this.latestMetric = null;
      }
    });
  }
}
