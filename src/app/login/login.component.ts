import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.component.html',
  styleUrls: ['login.component.scss']
})
export class LoginComponent {
  tab: 'login' | 'register' = 'login';

  loginEmail = '';
  loginPassword = '';

  regName = '';
  regEmail = '';
  regPassword = '';

  loading = false;
  errorMsg = '';
  showTerms = false;

  constructor(private auth: AuthService) {}

  switchTab(t: 'login' | 'register') {
    this.tab = t;
    this.errorMsg = '';
  }

  submit() {
    this.errorMsg = '';
    if (this.tab === 'login') {
      if (!this.loginEmail || !this.loginPassword) {
        this.errorMsg = 'Completa todos los campos.'; return;
      }
      this.loading = true;
      this.auth.login(this.loginEmail, this.loginPassword).subscribe({
        next: () => { this.loading = false; },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.error || 'Credenciales incorrectas.';
        }
      });
    } else {
      if (!this.regName || !this.regEmail || !this.regPassword) {
        this.errorMsg = 'Completa todos los campos.'; return;
      }
      if (this.regPassword.length < 8) {
        this.errorMsg = 'La contraseña debe tener al menos 8 caracteres.'; return;
      }
      this.loading = true;
      this.auth.register(this.regEmail, this.regPassword, this.regName).subscribe({
        next: () => { this.loading = false; },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.error?.error || 'Error al registrarse.';
        }
      });
    }
  }
}
