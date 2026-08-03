import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '../environments/environment';

export interface User { id: string; email: string; name?: string }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'sketch_token';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.hydrateTokenFromUrl();
    this.isAuthenticatedSubject.next(this.hasToken());
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  private hydrateTokenFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    if (!token) return;

    localStorage.setItem(this.tokenKey, token);
    params.delete('access_token');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, document.title, nextUrl);
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string, user: User }>(`${this.base}/login`, { email, password }).pipe(
      tap(res => {
        if (res?.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  register(email: string, password: string, name?: string) {
    return this.http.post<{ token: string, user: User }>(`${this.base}/register`, { email, password, name }).pipe(
      tap(res => {
        if (res?.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
