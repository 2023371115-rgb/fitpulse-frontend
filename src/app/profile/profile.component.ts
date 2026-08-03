import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';
 
interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  created_at: string;
}
 
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
 
  profile: UserProfile | null = null;
  loading = true;
  saving = false;
 
  name = '';
  currentPassword = '';
  newPassword = '';
  showCurrentPassword = false;
  showNewPassword = false;
  avatarPreview: string | null = null;
  avatarChanged = false;
  avatarError = '';
 
  successMsg = '';
  errorMsg = '';
 
  private base = `${environment.apiUrl}/profile`;
 
  constructor(private http: HttpClient, private auth: AuthService) {}
 
  ngOnInit() {
    this.http.get<{ user: UserProfile }>(this.base).subscribe({
      next: (res) => {
        this.profile = res.user;
        this.name = res.user.name || '';
        this.avatarPreview = res.user.avatar || null;
        this.loading = false;
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar el perfil.';
        this.loading = false;
      }
    });
  }
 
  get initial(): string {
    return this.name?.[0]?.toUpperCase() || this.profile?.email?.[0]?.toUpperCase() || '?';
  }
 
  get memberSince(): string {
    if (!this.profile?.created_at) return '';
    return new Date(this.profile.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });
  }
 
  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
 
    this.avatarError = '';
 
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      this.avatarError = 'Solo PNG, JPG o WEBP.';
      input.value = '';
      return;
    }
 
    if (file.size > 1.5 * 1024 * 1024) {
      this.avatarError = 'La imagen debe pesar menos de 1.5MB.';
      input.value = '';
      return;
    }
 
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result as string;
      this.avatarChanged = true;
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
 
  removeAvatar() {
    this.avatarPreview = null;
    this.avatarChanged = true;
  }
 
  save() {
    this.errorMsg = '';
    this.successMsg = '';
 
    const body: any = {};
    if (this.name && this.name !== this.profile?.name) body.name = this.name;
    if (this.avatarChanged) body.avatar = this.avatarPreview; // null = quitar avatar
 
    if (this.newPassword) {
      if (!this.currentPassword) {
        this.errorMsg = 'Ingresa tu contraseña actual.'; return;
      }
      if (this.newPassword.length < 8) {
        this.errorMsg = 'La nueva contraseña debe tener al menos 8 caracteres.'; return;
      }
      body.currentPassword = this.currentPassword;
      body.newPassword = this.newPassword;
    }
 
    if (Object.keys(body).length === 0) {
      this.errorMsg = 'No hay cambios que guardar.'; return;
    }
 
    this.saving = true;
    this.http.put<{ user: UserProfile; message: string }>(this.base, body).subscribe({
      next: (res) => {
        this.profile = res.user;
        this.name = res.user.name;
        this.avatarPreview = res.user.avatar || null;
        this.avatarChanged = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.successMsg = 'Perfil actualizado correctamente.';
        this.saving = false;
        setTimeout(() => this.successMsg = '', 3500);
      },
      error: (err) => {
        const backendMessage = err?.error?.error || '';
        this.errorMsg = backendMessage === 'Contraseña actual incorrecta'
          ? 'La contraseña actual no coincide con la de esta cuenta.'
          : backendMessage || 'Error al guardar.';
        this.saving = false;
      }
    });
  }
 
  logout() {
    this.auth.logout();
    window.location.reload();
  }
}
