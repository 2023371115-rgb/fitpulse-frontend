import { Component, OnDestroy, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { VirtualFolderComponent } from './virtual-folder/virtual-folder.component';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

interface Theme {
  name: string;
  label: string;
  description: string;
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  font: string;
  radius: number;
  density: number;
  pattern: PatternName;
  backgroundImage: string;
  backgroundFit: BackgroundFit;
}

type PatternName = 'none' | 'grid' | 'dots' | 'stars';
type BackgroundFit = 'cover' | 'contain' | 'repeat';

interface ThemeDraft {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  font: string;
  radius: number;
  density: number;
  pattern: PatternName;
  backgroundImage: string;
  backgroundFit: BackgroundFit;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnDestroy {
  @ViewChild(VirtualFolderComponent) virtualFolder?: VirtualFolderComponent;
  searchQuery = '';
  searchMode: 'internal' | 'external' = 'internal';
  externalType: 'web' | 'image' = 'web';
  showDashboard = false;
  showProfile = false;
  showTerms = false;
  menuOpen = false;
  searchPanelOpen = false;
  isAuthenticated$!: Observable<boolean>;  // ← solo declara el tipo
  showThemePicker = false;
  communitySearch = '';
  importText = '';
  themeMessage = '';
  tvMode = new URLSearchParams(window.location.search).get('tv') === '1';
  
  readonly themes: Theme[] = [
    {
      name: 'vital-fit',
      label: 'Vital Fit',
      description: 'Claro, clinico y comodo para revisar metas diarias.',
      primary: '#0F9D58',
      primaryDark: '#0B7A45',
      accent: '#B7F51B',
      background: '#F5FAF7',
      surface: '#FFFFFF',
      text: '#123024',
      textMuted: '#4D6C60',
      border: '#CFE8DB',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 8,
      density: 16,
      pattern: 'none',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
    {
      name: 'cardio-pro',
      label: 'Cardio Pro',
      description: 'Oscuro de alto contraste para ritmo cardiaco y TV.',
      primary: '#B7F51B',
      primaryDark: '#7FB80E',
      accent: '#F97316',
      background: '#07120C',
      surface: '#102018',
      text: '#DCFCE7',
      textMuted: '#86EFAC',
      border: '#1F3D2B',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 4,
      density: 14,
      pattern: 'grid',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
    {
      name: 'endurance',
      label: 'Endurance',
      description: 'Azul tecnico para sesiones, pasos y progreso semanal.',
      primary: '#0A66E8',
      primaryDark: '#0647A8',
      accent: '#FF6B00',
      background: '#F4F8FF',
      surface: '#FFFFFF',
      text: '#0F172A',
      textMuted: '#475569',
      border: '#BFDBFE',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 8,
      density: 16,
      pattern: 'dots',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
    {
      name: 'recovery',
      label: 'Recovery',
      description: 'Suave y legible para descanso, sueno y seguimiento ligero.',
      primary: '#0F766E',
      primaryDark: '#0B5C55',
      accent: '#8B5CF6',
      background: '#F3FBFA',
      surface: '#FFFFFF',
      text: '#134E4A',
      textMuted: '#527A76',
      border: '#99F6E4',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 6,
      density: 18,
      pattern: 'none',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
  ];

  readonly communityThemes: Theme[] = [
    {
      name: 'equipo-noche',
      label: 'Equipo noche',
      description: 'Modo oscuro para entrenamientos nocturnos.',
      primary: '#00D084',
      primaryDark: '#00A46A',
      accent: '#FFB000',
      background: '#0B1020',
      surface: '#111827',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      border: '#334155',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 4,
      density: 14,
      pattern: 'grid',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
    {
      name: 'competencia',
      label: 'Competencia',
      description: 'Contraste fuerte para marcas, calorias y rendimiento.',
      primary: '#EF233C',
      primaryDark: '#B90F25',
      accent: '#FFB703',
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#1F2937',
      textMuted: '#6B7280',
      border: '#FED7AA',
      font: '"Inter", "Segoe UI", sans-serif',
      radius: 6,
      density: 16,
      pattern: 'dots',
      backgroundImage: '',
      backgroundFit: 'cover',
    },
  ];

  readonly fontOptions = [
    { label: 'FitPulse', value: '"Inter", "Segoe UI", sans-serif' },
    { label: 'Sistema', value: 'system-ui, -apple-system, "Segoe UI", sans-serif' },
    { label: 'Compacta', value: 'Arial, Helvetica, sans-serif' },
    { label: 'Datos', value: 'Consolas, "Courier New", monospace' },
  ];

  readonly patternOptions: Array<{ label: string; value: PatternName }> = [
    { label: 'Liso', value: 'none' },
    { label: 'Zona cardiaca', value: 'grid' },
    { label: 'Pulso', value: 'dots' },
    { label: 'Meta', value: 'stars' },
  ];

  readonly backgroundFitOptions: Array<{ label: string; value: BackgroundFit }> = [
    { label: 'Cubrir', value: 'cover' },
    { label: 'Completa', value: 'contain' },
    { label: 'Mosaico', value: 'repeat' },
  ];

  activeTheme = 'vital-fit';
  customTheme: ThemeDraft = this.themeToDraft(this.themes[0]);

  get filteredCommunityThemes() {
    const query = this.communitySearch.trim().toLowerCase();
    if (!query) return this.communityThemes;
    return this.communityThemes.filter(theme =>
      `${theme.label} ${theme.description}`.toLowerCase().includes(query)
    );
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    const savedCustom = this.readSavedCustomTheme();
    if (savedCustom) {
      this.customTheme = savedCustom;
      this.activeTheme = 'personal';
      this.applyDraft(savedCustom);
      return;
    }

    const saved = localStorage.getItem('sk_theme');
    this.applyTheme(saved || 'vital-fit');
  }

  ngOnDestroy() {
    document.body.classList.remove('modal-open');
  }

  toggleThemePicker() {
    this.showThemePicker = !this.showThemePicker;
    if (this.showThemePicker) this.menuOpen = false;
    this.syncModalScroll();
  }

  closeThemePicker() {
    this.showThemePicker = false;
    this.syncModalScroll();
  }

  openProfile() {
    this.showProfile = true;
    this.menuOpen = false;
    this.syncModalScroll();
  }

  closeProfile() {
    this.showProfile = false;
    this.syncModalScroll();
  }

  openTerms() {
    this.showTerms = true;
    this.menuOpen = false;
    this.syncModalScroll();
  }

  closeTerms() {
    this.showTerms = false;
    this.syncModalScroll();
  }

  applyTheme(name: string) {
    const t = this.themes.find(x => x.name === name) || this.themes[0];
    if (!t) return;
    this.activeTheme = t.name;
    this.customTheme = this.themeToDraft(t);
    localStorage.setItem('sk_theme', t.name);
    localStorage.removeItem('sk_profile_theme');
    this.applyTokens(t);
  }

  applyCustomTheme() {
    const safeDraft = this.sanitizeDraft(this.customTheme);
    this.customTheme = safeDraft;
    this.activeTheme = 'personal';
    localStorage.setItem('sk_profile_theme', JSON.stringify(safeDraft));
    localStorage.setItem('sk_theme', 'personal');
    this.applyDraft(safeDraft);
  }

  applyCommunityTheme(theme: Theme) {
    this.activeTheme = theme.name;
    this.customTheme = this.themeToDraft(theme);
    localStorage.setItem('sk_theme', theme.name);
    localStorage.setItem('sk_profile_theme', JSON.stringify(this.customTheme));
    this.applyTokens(theme);
    this.themeMessage = `${theme.label} aplicado al panel de actividad.`;
  }

  onBackgroundImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      this.themeMessage = 'Solo se aceptan imagenes PNG, JPG, WEBP o GIF.';
      input.value = '';
      return;
    }

    if (file.size > 1200 * 1024) {
      this.themeMessage = 'La imagen debe pesar menos de 1.2 MB para poder guardarla localmente.';
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!this.safeImageDataUrl(result)) {
        this.themeMessage = 'No pude leer esa imagen como fondo seguro.';
        return;
      }

      this.customTheme.backgroundImage = result;
      this.applyCustomTheme();
      this.themeMessage = 'Imagen de fondo aplicada.';
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeBackgroundImage() {
    this.customTheme.backgroundImage = '';
    this.applyCustomTheme();
    this.themeMessage = 'Imagen de fondo eliminada.';
  }

  exportTheme() {
    const safeDraft = this.sanitizeDraft(this.customTheme);
    this.importText = JSON.stringify(safeDraft, null, 2);
    this.themeMessage = 'Perfil visual listo para respaldar.';
  }

  importTheme() {
    try {
      const parsed = JSON.parse(this.importText);
      this.customTheme = this.sanitizeDraft(parsed);
      this.applyCustomTheme();
    this.themeMessage = 'Perfil visual importado correctamente.';
    } catch {
      this.themeMessage = 'El JSON del tema no es valido.';
    }
  }

  resetTheme() {
    this.applyTheme('vital-fit');
  }

  private applyDraft(draft: ThemeDraft) {
    const isDark = this.isDarkColor(draft.background);
    this.applyTokens({
      name: 'personal',
      label: 'Personal',
      description: '',
      primary: draft.primary,
      primaryDark: this.shadeHex(draft.primary, -18),
      accent: draft.accent,
      background: draft.background,
      surface: draft.surface,
      text: isDark ? '#F8FAFC' : '#0F172A',
      textMuted: isDark ? '#CBD5E1' : '#64748B',
      border: isDark ? '#334155' : '#CBD5E1',
      font: draft.font,
      radius: draft.radius,
      density: draft.density,
      pattern: draft.pattern,
      backgroundImage: draft.backgroundImage,
      backgroundFit: draft.backgroundFit,
    });
  }

  private applyTokens(t: Theme) {
    const root = document.documentElement.style;
    root.setProperty('--color-primary', t.primary);
    root.setProperty('--color-primary-dark', t.primaryDark);
    root.setProperty('--color-on-primary', this.isDarkColor(t.primary) ? '#FFFFFF' : '#06120D');
    root.setProperty('--color-accent', t.accent);
    root.setProperty('--color-background', t.background);
    root.setProperty('--color-surface', t.surface);
    root.setProperty('--color-text', t.text);
    root.setProperty('--color-text-muted', t.textMuted);
    root.setProperty('--color-border', t.border);
    root.setProperty('--color-border-strong', `color-mix(in srgb, ${t.border} 58%, ${t.text})`);
    root.setProperty('--font-body', t.font);
    root.setProperty('--spacing-md', `${t.density}px`);
    root.setProperty('--spacing-lg', `${t.density + 8}px`);
    root.setProperty('--radius-sm', `${Math.max(2, t.radius - 2)}px`);
    root.setProperty('--radius-md', `${t.radius}px`);
    root.setProperty('--radius-lg', `${t.radius + 4}px`);
    root.setProperty('--profile-bg-pattern', this.patternValue(t.pattern, t.border));
    root.setProperty('--profile-bg-size', t.pattern === 'stars' ? '28px 28px' : '20px 20px');
    root.setProperty('--profile-bg-image', t.backgroundImage ? `url("${t.backgroundImage}")` : 'none');
    root.setProperty('--profile-bg-fit', t.backgroundFit === 'repeat' ? 'auto' : t.backgroundFit);
    root.setProperty('--profile-bg-repeat', t.backgroundFit === 'repeat' ? 'repeat' : 'no-repeat');
    root.setProperty('--profile-bg-position', 'center');
    root.setProperty('--profile-bg-attachment', t.backgroundImage ? 'fixed' : 'scroll');
    document.body.style.backgroundColor = t.background;
  }

  private themeToDraft(theme: Theme): ThemeDraft {
    return {
      primary: theme.primary,
      accent: theme.accent,
      background: theme.background,
      surface: theme.surface,
      font: theme.font,
      radius: theme.radius,
      density: theme.density,
      pattern: theme.pattern,
      backgroundImage: theme.backgroundImage,
      backgroundFit: theme.backgroundFit,
    };
  }

  private readSavedCustomTheme(): ThemeDraft | null {
    const saved = localStorage.getItem('sk_profile_theme');
    if (!saved) return null;

    try {
      return this.sanitizeDraft(JSON.parse(saved));
    } catch {
      localStorage.removeItem('sk_profile_theme');
      return null;
    }
  }

  private sanitizeDraft(value: Partial<ThemeDraft>): ThemeDraft {
    const fallback = this.themeToDraft(this.themes[0]);
    const fonts = this.fontOptions.map(font => font.value);
    const patterns = this.patternOptions.map(pattern => pattern.value);
    const backgroundFits = this.backgroundFitOptions.map(fit => fit.value);

    return {
      primary: this.safeHex(value.primary, fallback.primary),
      accent: this.safeHex(value.accent, fallback.accent),
      background: this.safeHex(value.background, fallback.background),
      surface: this.safeHex(value.surface, fallback.surface),
      font: fonts.includes(value.font || '') ? value.font as string : fallback.font,
      radius: this.clampNumber(value.radius, 2, 18, fallback.radius),
      density: this.clampNumber(value.density, 10, 24, fallback.density),
      pattern: patterns.includes(value.pattern as PatternName) ? value.pattern as PatternName : fallback.pattern,
      backgroundImage: '',
      backgroundFit: backgroundFits.includes(value.backgroundFit as BackgroundFit) ? value.backgroundFit as BackgroundFit : fallback.backgroundFit,
    };
  }

  private safeHex(value: unknown, fallback: string) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : fallback;
  }

  private safeImageDataUrl(value: unknown) {
    return typeof value === 'string'
      && value.length < 1800000
      && /^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(value);
  }

  private clampNumber(value: unknown, min: number, max: number, fallback: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, Math.round(numeric)));
  }

  private isDarkColor(hex: string) {
    const color = hex.replace('#', '');
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);
    return (red * 299 + green * 587 + blue * 114) / 1000 < 140;
  }

  private shadeHex(hex: string, percent: number) {
    const color = hex.replace('#', '');
    const amount = Math.round(2.55 * percent);
    const red = Math.min(255, Math.max(0, parseInt(color.slice(0, 2), 16) + amount));
    const green = Math.min(255, Math.max(0, parseInt(color.slice(2, 4), 16) + amount));
    const blue = Math.min(255, Math.max(0, parseInt(color.slice(4, 6), 16) + amount));
    return `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  }

  private patternValue(pattern: PatternName, color: string) {
    const soft = `${color}24`;
    if (pattern === 'grid') {
      return `linear-gradient(${soft} 1px, transparent 1px), linear-gradient(90deg, ${soft} 1px, transparent 1px)`;
    }
    if (pattern === 'dots') {
      return `radial-gradient(circle, ${soft} 1px, transparent 1.5px)`;
    }
    if (pattern === 'stars') {
      return `radial-gradient(circle at 25% 25%, ${soft} 1px, transparent 2px), radial-gradient(circle at 75% 65%, ${soft} 1px, transparent 2px)`;
    }
    return 'none';
  }

  onLogout() {
    document.body.classList.remove('modal-open');
    this.menuOpen = false;
    this.authService.logout();
    window.location.reload();
  }

  onSearch() {
    const query = this.searchQuery.trim();
    this.searchPanelOpen = !!query;
    this.virtualFolder?.searchFiles(query, this.searchMode, this.externalType);
    if (query) {
      this.syncTv('devices', 3, `Busqueda desde telefono: ${query}`);
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchPanelOpen = false;
    this.virtualFolder?.searchFiles('', this.searchMode, this.externalType);
  }

  openTvMode() {
    this.menuOpen = false;
    const token = this.authService.getToken();
    const tokenParam = token ? `&access_token=${encodeURIComponent(token)}` : '';
    window.open(`${window.location.origin}${window.location.pathname}?tv=1${tokenParam}`, '_blank');
  }

  toggleDashboard() {
    this.showDashboard = !this.showDashboard;
    this.menuOpen = false;
  }

  toggleMobileMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private syncTv(selectedCardId: 'steps' | 'heart' | 'sessions' | 'devices', selectedIndex: number, lastAction: string) {
    this.http.post(`${environment.apiUrl}/tv/state`, {
      selectedCardId,
      selectedIndex,
      lastAction
    }).subscribe({ error: () => void 0 });
  }

  private syncModalScroll() {
    document.body.classList.toggle('modal-open', this.showThemePicker || this.showProfile || this.showTerms);
  }
}
