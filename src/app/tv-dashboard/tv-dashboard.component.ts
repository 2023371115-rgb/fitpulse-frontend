import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth.service';

interface TvField {
  label: string;
  value: string;
}

interface TvCard {
  id: 'steps' | 'heart' | 'sessions' | 'devices';
  label: string;
  value: string;
  detail: string;
  media: string;
  fields: TvField[];
}

interface TvPayload {
  state: {
    selectedIndex: number;
    selectedCardId: string;
    lastAction: string;
    updatedAt: string;
  };
  cards: TvCard[];
}

@Component({
  selector: 'app-tv-dashboard',
  templateUrl: './tv-dashboard.component.html',
  styleUrls: ['./tv-dashboard.component.scss']
})
export class TvDashboardComponent implements OnInit, OnDestroy {
  cards: TvCard[] = [];
  selectedIndex = 0;
  now = new Date();
  lastAction = 'Sistema listo';
  offline = !navigator.onLine;
  loading = true;
  videoFailed = false;

  private clock?: number;
  private events?: EventSource;
  private readonly api = environment.apiUrl;
  private readonly cacheKey = 'fitpulse_tv_payload';

  readonly mediaMap: Record<string, { poster: string; video: string }> = {
    steps: {
      poster: 'linear-gradient(135deg, #102a1f, #0f9d58 48%, #f97316)',
      video: ''
    },
    heart: {
      poster: 'linear-gradient(135deg, #2a1018, #dc2626 48%, #f97316)',
      video: ''
    },
    sessions: {
      poster: 'linear-gradient(135deg, #101728, #2563eb 48%, #22c55e)',
      video: ''
    },
    devices: {
      poster: 'linear-gradient(135deg, #17142a, #7c3aed 48%, #0ea5e9)',
      video: ''
    }
  };

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCachedPayload();
    this.loadState();
    this.connectEvents();
    this.clock = window.setInterval(() => {
      this.now = new Date();
      this.cleanupOldLocalData();
    }, 1000);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    this.cleanupOldLocalData();
  }

  ngOnDestroy(): void {
    if (this.clock) window.clearInterval(this.clock);
    this.events?.close();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  get selectedCard(): TvCard | undefined {
    return this.cards[this.selectedIndex];
  }

  get backgroundStyle(): string {
    const media = this.mediaMap[this.selectedCard?.media || 'steps'];
    return media?.poster || this.mediaMap['steps'].poster;
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const previous = this.selectedIndex;
    const col = this.selectedIndex % 2;
    const row = Math.floor(this.selectedIndex / 2);

    if (event.key === 'ArrowRight') this.selectedIndex = row * 2 + Math.min(1, col + 1);
    if (event.key === 'ArrowLeft') this.selectedIndex = row * 2 + Math.max(0, col - 1);
    if (event.key === 'ArrowDown') this.selectedIndex = Math.min(3, this.selectedIndex + 2);
    if (event.key === 'ArrowUp') this.selectedIndex = Math.max(0, this.selectedIndex - 2);

    if (event.key === 'Enter') {
      this.pushSelection('Enter/OK en Smart TV');
      event.preventDefault();
      return;
    }

    if (previous !== this.selectedIndex) {
      this.videoFailed = false;
      this.pushSelection('Navegacion D-pad en Smart TV');
      event.preventDefault();
    }
  }

  selectCard(index: number): void {
    this.selectedIndex = Math.max(0, Math.min(3, index));
    this.pushSelection('Seleccion tactil en TV');
  }

  trackByCard(_: number, card: TvCard): string {
    return card.id;
  }

  onVideoError(): void {
    this.videoFailed = true;
  }

  private loadState(): void {
    this.http.get<TvPayload>(`${this.api}/tv/state`).subscribe({
      next: payload => this.applyPayload(payload),
      error: () => {
        this.loading = false;
        this.offline = true;
      }
    });
  }

  private connectEvents(): void {
    const token = this.auth.getToken();
    if (!token) return;
    this.events?.close();
    this.events = new EventSource(`${this.api}/tv/events?token=${encodeURIComponent(token)}`);
    this.events.addEventListener('tv-state', (event: MessageEvent) => {
      this.applyPayload(JSON.parse(event.data) as TvPayload);
      this.offline = false;
    });
    this.events.onerror = () => {
      this.offline = true;
    };
  }

  private applyPayload(payload: TvPayload): void {
    if (!payload.cards?.length) return;
    this.cards = payload.cards.slice(0, 4);
    const indexFromId = this.cards.findIndex(card => card.id === payload.state?.selectedCardId);
    this.selectedIndex = indexFromId >= 0
      ? indexFromId
      : Math.max(0, Math.min(3, payload.state?.selectedIndex || 0));
    this.lastAction = payload.state?.lastAction || this.lastAction;
    this.loading = false;
    localStorage.setItem(this.cacheKey, JSON.stringify({
      createdAt: Date.now(),
      payload
    }));
  }

  private loadCachedPayload(): void {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - Number(parsed.createdAt || 0) < 30 * 24 * 60 * 60 * 1000) {
        this.applyPayload(parsed.payload);
      }
    } catch {
      localStorage.removeItem(this.cacheKey);
    }
  }

  private pushSelection(source: string): void {
    const selectedCardId = this.selectedCard?.id;
    if (!selectedCardId) return;
    this.http.post(`${this.api}/tv/state`, {
      selectedIndex: this.selectedIndex,
      selectedCardId,
      lastAction: `${source}: ${this.selectedCard?.label}`
    }).subscribe({ error: () => void 0 });
  }

  private cleanupOldLocalData(): void {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - Number(parsed.createdAt || 0) > 30 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.cacheKey);
      }
    } catch {
      localStorage.removeItem(this.cacheKey);
    }
  }

  private handleOnline = () => {
    this.offline = false;
    this.loadState();
    this.connectEvents();
  };

  private handleOffline = () => {
    this.offline = true;
  };
}
