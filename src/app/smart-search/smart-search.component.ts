import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface SearchHit {
  _index: string;
  _id: string;
  _score: number;
  _source: any;
  highlight: Record<string, string[]>;
}

interface SearchResponse {
  took: number;
  query: string;
  hits: { total: number; max_score: number | null; hits: SearchHit[] };
  aggregations: { by_index: Record<string, number> };
  suggestion: string | null;
}

const INDEX_LABEL: Record<string, string> = {
  sessions: 'Sesiones', goals: 'Metas', notifications: 'Notificaciones', devices: 'Dispositivos',
  tickets: 'Reportes de fallos', screens: 'Secciones', users: 'Usuarios',
};

/** Resultados del buscador interno (/api/search, motor tipo Elasticsearch). */
@Component({
  selector: 'app-smart-search',
  templateUrl: './smart-search.component.html',
  styleUrls: ['./smart-search.component.scss']
})
export class SmartSearchComponent {
  @Output() openSection = new EventEmitter<string>();
  @Output() useSuggestion = new EventEmitter<string>();

  result: SearchResponse | null = null;
  loading = false;
  errorMsg = '';
  filter = '';
  private lastQuery = '';

  constructor(private http: HttpClient) {}

  run(query: string) {
    this.lastQuery = query.trim();
    this.filter = '';
    if (!this.lastQuery) { this.result = null; this.errorMsg = ''; return; }
    this.fetch();
  }

  setFilter(index: string) {
    this.filter = this.filter === index ? '' : index;
    this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.errorMsg = '';
    const params: Record<string, string> = { q: this.lastQuery, size: '30' };
    if (this.filter) params['index'] = this.filter;
    this.http.get<SearchResponse>(`${environment.apiUrl}/search`, { params }).subscribe({
      next: (res) => {
        // Las facetas siempre muestran el total por índice de la búsqueda sin filtrar.
        if (this.filter && this.result) res.aggregations = this.result.aggregations;
        this.result = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'No se pudo completar la búsqueda.';
        this.loading = false;
      }
    });
  }

  get facets(): Array<{ index: string; label: string; count: number }> {
    const by = this.result?.aggregations?.by_index || {};
    return Object.entries(by).map(([index, count]) => ({ index, label: this.label(index), count }));
  }

  label(index: string): string {
    return INDEX_LABEL[index] || index;
  }

  /** Primer fragmento resaltado del documento (título primero). */
  titleHtml(hit: SearchHit): string {
    return hit.highlight['title']?.[0] || this.plainTitle(hit);
  }

  bodyHtml(hit: SearchHit): string {
    return hit.highlight['body']?.[0] || '';
  }

  private plainTitle(hit: SearchHit): string {
    const s = hit._source || {};
    return s.title || s.name || s.email || s.code || this.label(hit._index);
  }

  detail(hit: SearchHit): string {
    const s = hit._source || {};
    switch (hit._index) {
      case 'sessions':
        return [s.started_at ? new Date(s.started_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
          s.distance_km ? `${s.distance_km} km` : '', s.calories ? `${Math.round(s.calories)} kcal` : ''].filter(Boolean).join(' · ');
      case 'goals': return `${s.target} ${s.unit} · ${s.period === 'weekly' ? 'semanal' : 'diaria'}`;
      case 'tickets': return `${s.code} · ${s.status} · gravedad ${s.severity}`;
      case 'devices': return `${s.type} · ${s.status}${s.battery != null ? ' · ' + s.battery + '%' : ''}`;
      case 'users': return `${s.role}${s.active ? '' : ' · deshabilitado'}`;
      default: return '';
    }
  }

  open(hit: SearchHit) {
    this.openSection.emit(hit._index === 'screens' ? hit._id : hit._index);
  }
}
