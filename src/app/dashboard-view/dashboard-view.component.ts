import { Component, Input, OnChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.scss'],
})
export class DashboardViewComponent implements OnChanges {
  @Input() theme?: {
    primary?: string;
    accent?: string;
    background?: string;
    surface?: string;
  };

  flutterUrl: SafeResourceUrl;
  themeKey = '';

  constructor(private sanitizer: DomSanitizer) {
    this.flutterUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      this.buildFlutterUrl()
    );
  }

  ngOnChanges() {
    const nextUrl = this.buildFlutterUrl();
    this.themeKey = nextUrl;
    this.flutterUrl = this.sanitizer.bypassSecurityTrustResourceUrl(nextUrl);
  }

  private buildFlutterUrl() {
    const theme = this.theme || {};
    const background = this.safeHex(theme.background, this.cssVar('--color-background', '#F5FAF7'));
    const text = this.readableTextFor(background);
    const params = new URLSearchParams({
      primary: this.safeHex(theme.primary, this.cssVar('--color-primary', '#0F9D58')),
      accent: this.safeHex(theme.accent, this.cssVar('--color-accent', '#B7F51B')),
      background,
      surface: this.safeHex(theme.surface, this.cssVar('--color-surface', '#FFFFFF')),
      text,
      muted: this.isDark(background) ? '#CBD5E1' : '#64748B',
      border: this.isDark(background) ? '#334155' : '#CBD5E1',
    });

    return `assets/flutter_dashboard/index.html?${params.toString()}`;
  }

  private cssVar(name: string, fallback: string) {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  }

  private safeHex(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
  }

  private readableTextFor(hex: string) {
    return this.isDark(hex) ? '#F8FAFC' : '#0F172A';
  }

  private isDark(hex: string) {
    const color = hex.replace('#', '');
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 < 140;
  }
}
