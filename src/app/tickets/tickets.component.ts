import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Ticket {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  status_label: string;
  screen: string | null;
  platform: string | null;
  admin_note: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const CATEGORY_OPTIONS = [
  { value: 'bug', label: 'Error' },
  { value: 'crash', label: 'Se cierra la app' },
  { value: 'ui', label: 'Diseño / pantalla' },
  { value: 'performance', label: 'Lentitud' },
  { value: 'data', label: 'Datos incorrectos' },
  { value: 'other', label: 'Otro' },
];
export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

/** Reportar un fallo y ver el estado de mis reportes. */
@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['../admin-panel/admin-panel.component.scss', './tickets.component.scss']
})
export class TicketsComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  readonly categories = CATEGORY_OPTIONS;
  readonly severities = SEVERITY_OPTIONS;
  readonly screens = ['Inicio', 'Panel Salud', 'Metas y sesiones', 'Dispositivos', 'Perfil', 'Buscador', 'Modo TV', 'Otra'];

  form = { title: '', description: '', category: 'bug', severity: 'medium', screen: 'Inicio' };
  tickets: Ticket[] = [];
  loading = true;
  sending = false;
  errorMsg = '';
  successMsg = '';

  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.http.get<{ items: Ticket[] }>(this.base).subscribe({
      next: (res) => { this.tickets = res.items || []; this.loading = false; },
      error: (err) => { this.errorMsg = err?.error?.error || 'No se pudieron cargar tus reportes.'; this.loading = false; }
    });
  }

  submit() {
    this.errorMsg = '';
    this.successMsg = '';
    if (this.form.title.trim().length < 3) { this.errorMsg = 'Escribe un título de al menos 3 caracteres.'; return; }
    if (this.form.description.trim().length < 10) { this.errorMsg = 'Describe el fallo con al menos 10 caracteres.'; return; }
    this.sending = true;
    this.http.post<{ ticket: Ticket }>(this.base, {
      ...this.form,
      platform: 'web',
      app_version: 'web-1.2.0',
      device_info: navigator.userAgent.slice(0, 250),
    }).subscribe({
      next: (res) => {
        this.sending = false;
        this.tickets = [res.ticket, ...this.tickets];
        this.successMsg = `Reporte ${res.ticket.code} enviado. Te avisaremos cuando cambie de estado.`;
        this.form = { title: '', description: '', category: 'bug', severity: 'medium', screen: this.form.screen };
      },
      error: (err) => {
        this.sending = false;
        this.errorMsg = err?.error?.error || 'No se pudo enviar el reporte. Revisa tu conexión.';
      }
    });
  }

  categoryLabel(v: string) { return CATEGORY_OPTIONS.find(c => c.value === v)?.label || v; }
  severityLabel(v: string) { return SEVERITY_OPTIONS.find(c => c.value === v)?.label || v; }
  date(v: string) { return new Date(v).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); }
}
