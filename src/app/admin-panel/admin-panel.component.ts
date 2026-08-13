import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
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

  users: AdminUser[] = [];
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

  isSuperAdmin(user: AdminUser): boolean {
    return String(user.name || '').trim().toLowerCase() === 'superadmin';
  }

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
