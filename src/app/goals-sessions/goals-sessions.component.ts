import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface Goal {
  id: string;
  type: string;
  target: number;
  unit: string;
  active: number;
  created_at: string;
}

interface Session {
  id: string;
  type: string;
  started_at: string;
  ended_at: string | null;
  steps: number | null;
  calories: number | null;
  avg_heart_rate: number | null;
  notes: string | null;
  device_name: string | null;
}

interface WeeklySummary {
  total_sessions: number;
  total_steps: number;
  total_calories: number;
  avg_heart_rate: number;
  total_minutes: number;
}

type SessionMetric = 'steps' | 'calories' | 'avg_heart_rate';
type SessionType = 'running' | 'cycling' | 'walking' | 'gym' | 'swimming' | 'other';

@Component({
  selector: 'app-goals-sessions',
  templateUrl: './goals-sessions.component.html',
  styleUrls: ['./goals-sessions.components.scss']
})
export class GoalsSessionsComponent implements OnInit {
  goals: Goal[] = [];
  sessions: Session[] = [];
  summary: WeeklySummary | null = null;

  // Nueva meta
  showGoalForm = false;
  newGoalType = 'steps';
  newGoalTarget: number | null = null;
  goalTypes = [
    { value: 'steps', label: 'Pasos diarios', unit: 'pasos' },
    { value: 'calories', label: 'Calorías', unit: 'kcal' },
    { value: 'heart_rate', label: 'Frec. cardíaca máx.', unit: 'lpm' },
    { value: 'weight', label: 'Peso objetivo', unit: 'kg' },
    { value: 'sleep', label: 'Horas de sueño', unit: 'hrs' },
  ];

  // Nueva sesión
  showNewSession = false;
  newSession = {
    type: 'other' as SessionType,
    started_at: '',
    ended_at: '',
    steps: null as number | null,
    calories: null as number | null,
    avg_heart_rate: null as number | null,
    notes: ''
  };
  sessionTypes = [
    { value: 'running', label: 'Correr' },
    { value: 'cycling', label: 'Ciclismo' },
    { value: 'walking', label: 'Caminar' },
    { value: 'gym', label: 'Gym' },
    { value: 'swimming', label: 'Natacion' },
    { value: 'other', label: 'Otro' },
  ];

  readonly sessionForms: Record<SessionType, {
    hint: string;
    fields: SessionMetric[];
    notes: string;
  }> = {
    running: {
      hint: 'Registra pasos, calorias y frecuencia para carrera.',
      fields: ['steps', 'calories', 'avg_heart_rate'],
      notes: 'Ritmo, ruta, sensaciones o molestias'
    },
    walking: {
      hint: 'Caminar usa pasos como metrica principal.',
      fields: ['steps', 'calories', 'avg_heart_rate'],
      notes: 'Ruta, ritmo o sensaciones'
    },
    cycling: {
      hint: 'Ciclismo no usa pasos; enfocate en calorias y FC.',
      fields: ['calories', 'avg_heart_rate'],
      notes: 'Distancia, ruta, cadencia o potencia'
    },
    gym: {
      hint: 'Gym no usa pasos; registra carga general y FC si aplica.',
      fields: ['calories', 'avg_heart_rate'],
      notes: 'Rutina, series, repeticiones o grupos musculares'
    },
    swimming: {
      hint: 'Natacion no usa pasos; anota distancia o vueltas en notas.',
      fields: ['calories', 'avg_heart_rate'],
      notes: 'Metros, vueltas, estilo o intensidad'
    },
    other: {
      hint: 'Usa los campos que tengas disponibles para esta actividad.',
      fields: ['calories', 'avg_heart_rate'],
      notes: 'Detalle de la actividad'
    }
  };

  msg = '';
  msgType = '';
  loading = true;
  savingGoal = false;

  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    Promise.all([
      this.http.get<Goal[]>(`${this.api}/goals`).toPromise(),
      this.http.get<Session[]>(`${this.api}/sessions`).toPromise(),
      this.http.get<WeeklySummary>(`${this.api}/sessions/summary`).toPromise()
    ]).then(([goals, sessions, summary]) => {
      this.goals = goals || [];
      this.sessions = sessions || [];
      this.summary = summary || null;
      this.loading = false;
    }).catch(() => {
      this.showMsg('Error al cargar datos', 'error');
      this.loading = false;
    });
  }

  get selectedGoalUnit(): string {
    return this.goalTypes.find(g => g.value === this.newGoalType)?.unit || '';
  }

  get activeSessionForm() {
    return this.sessionForms[this.newSession.type] || this.sessionForms.other;
  }

  showSessionField(field: SessionMetric): boolean {
    return this.activeSessionForm.fields.includes(field);
  }

  onSessionTypeChange(type: string) {
    this.newSession.type = type as SessionType;
    if (!this.showSessionField('steps')) this.newSession.steps = null;
  }

  addGoal() {
    const target = Number(this.newGoalTarget);
    if (!Number.isFinite(target) || target <= 0) {
      return this.showMsg('Ingresa un valor mayor a 0 para la meta', 'error');
    }
    if (this.savingGoal) return;

    this.savingGoal = true;
    const unit = this.selectedGoalUnit;
    this.http.post<Goal>(`${this.api}/goals`, {
      type: this.newGoalType, target, unit
    }).subscribe({
      next: (g) => {
        this.goals.unshift(g);
        this.newGoalTarget = null;
        this.savingGoal = false;
        this.showGoalForm = false;
        this.showMsg('Meta agregada', 'success');
        this.syncTv('steps', 0, `Meta agregada desde telefono: ${this.goalLabel(g.type)}`);
        this.loadAll();
      },
      error: (e) => {
        this.savingGoal = false;
        this.showMsg(e?.error?.error || 'Error al agregar meta', 'error');
      }
    });
  }

  toggleGoal(goal: Goal) {
    this.http.patch(`${this.api}/goals/${goal.id}`, { active: !goal.active }).subscribe({
      next: () => { goal.active = goal.active ? 0 : 1; },
      error: () => this.showMsg('Error al actualizar meta', 'error')
    });
  }

  deleteGoal(goal: Goal) {
    this.http.delete(`${this.api}/goals/${goal.id}`).subscribe({
      next: () => { this.goals = this.goals.filter(g => g.id !== goal.id); },
      error: () => this.showMsg('Error al eliminar meta', 'error')
    });
  }

  addSession() {
    if (!this.newSession.started_at) return this.showMsg('Ingresa fecha de inicio', 'error');
    this.http.post<Session>(`${this.api}/sessions`, this.newSession).subscribe({
      next: (s) => {
        this.sessions.unshift(s);
        this.showNewSession = false;
        this.newSession = { type: 'other', started_at: '', ended_at: '', steps: null, calories: null, avg_heart_rate: null, notes: '' };
        this.showMsg('Sesión registrada', 'success');
        this.syncTv('sessions', 2, `Sesion registrada desde telefono: ${this.sessionLabel(s.type)}`);
        this.loadAll();
      },
      error: (e) => this.showMsg(e?.error?.error || 'Error al registrar sesión', 'error')
    });
  }

  deleteSession(session: Session) {
    this.http.delete(`${this.api}/sessions/${session.id}`).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== session.id);
        this.loadAll();
      },
      error: () => this.showMsg('Error al eliminar sesión', 'error')
    });
  }

  sessionLabel(type: string): string {
    return this.sessionTypes.find(s => s.value === type)?.label || type;
  }

  goalLabel(type: string): string {
    return this.goalTypes.find(t => t.value === type)?.label || type;
  }

  sessionIcon(type: string): string {
    const knownTypes = this.sessionTypes.map(s => s.value);
    const iconType = knownTypes.includes(type) ? type : 'other';
    return `assets/sport-icons/${iconType}.svg`;
  }

  duration(s: Session): string {
    if (!s.ended_at) return '—';
    const mins = Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins/60)}h ${mins%60}min`;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  showMsg(text: string, type: string) {
    this.msg = text;
    this.msgType = type;
    setTimeout(() => { this.msg = ''; }, 3500);
  }

  private syncTv(selectedCardId: 'steps' | 'heart' | 'sessions' | 'devices', selectedIndex: number, lastAction: string) {
    this.http.post(`${this.api}/tv/state`, {
      selectedCardId,
      selectedIndex,
      lastAction
    }).subscribe({ error: () => void 0 });
  }
}
