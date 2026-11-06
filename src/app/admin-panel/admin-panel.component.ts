import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Ticket, CATEGORY_OPTIONS, SEVERITY_OPTIONS } from '../tickets/tickets.component';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  active: number | boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss']
})
export class AdminPanelComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  tab: 'users' | 'tickets' = 'users';
  users: AdminUser[] = [];
  tickets: Ticket[] = [];
  ticketCounts: Record<string, number> = {};
  ticketFilter = '';
  ticketsLoading = false;
  notes: Record<string, string> = {};
  readonly statusOptions = [
    { value: 'open', label: 'Abierto' },
    { value: 'in_progress', label: 'En revisión' },
    { value: 'resolved', label: 'Resuelto' },
    { value: 'closed', label: 'Cerrado' },
  ];
  loading = true;
  savingId = '';
  errorMsg = '';
  successMsg = '';

  private base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.errorMsg = '';
    this.http.get<{ users: AdminUser[] }>(`${this.base}/users`).subscribe({
      next: (res) => {
        this.users = res.users || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'No se pudo cargar el panel admin.';
        this.loading = false;
      }
    });
  }

  isActive(user: AdminUser): boolean {
    return user.active === true || Number(user.active) === 1;
  }

  /** Los administradores no se pueden deshabilitar desde el panel. */
  isSuperAdmin(user: AdminUser): boolean {
    return user.role === 'admin';
  }

  showTickets() {
    this.tab = 'tickets';
    this.loadTickets();
  }

  loadTickets() {
    this.ticketsLoading = true;
    this.errorMsg = '';
    const params: Record<string, string> = this.ticketFilter ? { status: this.ticketFilter } : {};
    this.http.get<{ items: Ticket[]; counts: Record<string, number> }>(`${this.base}/tickets`, { params }).subscribe({
      next: (res) => {
        this.tickets = res.items || [];
        this.ticketCounts = res.counts || {};
        this.notes = Object.fromEntries(this.tickets.map(t => [t.id, t.admin_note || '']));
        this.ticketsLoading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'No se pudieron cargar los reportes.';
        this.ticketsLoading = false;
      }
    });
  }

  updateTicket(t: Ticket, status: string) {
    this.savingId = t.id;
    this.errorMsg = '';
    this.http.patch<{ ticket: Ticket }>(`${this.base}/tickets/${t.id}`, { status, admin_note: this.notes[t.id] || null }).subscribe({
      next: (res) => {
        this.tickets = this.tickets.map(x => x.id === t.id ? { ...res.ticket, user_email: t.user_email, user_name: t.user_name } : x);
        this.successMsg = `${res.ticket.code} actualizado: ${res.ticket.status_label}. Se notificó al usuario.`;
        this.savingId = '';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'No se pudo actualizar el reporte.';
        this.savingId = '';
      }
    });
  }

  categoryLabel(v: string) { return CATEGORY_OPTIONS.find(c => c.value === v)?.label || v; }
  severityLabel(v: string) { return SEVERITY_OPTIONS.find(c => c.value === v)?.label || v; }

  toggleUser(user: AdminUser) {
    this.savingId = user.id;
    this.errorMsg = '';
    this.successMsg = '';
    const nextActive = !this.isActive(user);

    this.http.patch<{ user: AdminUser }>(`${this.base}/users/${user.id}`, { active: nextActive }).subscribe({
      next: (res) => {
        this.users = this.users.map(item => item.id === user.id ? res.user : item);
        this.successMsg = nextActive ? 'Usuario habilitado.' : 'Usuario deshabilitado.';
        this.savingId = '';
        setTimeout(() => this.successMsg = '', 2600);
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'No se pudo actualizar el usuario.';
        this.savingId = '';
      }
    });
  }

  createdLabel(user: AdminUser): string {
    if (!user.created_at) return '-';
    return new Date(user.created_at).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  }
}
