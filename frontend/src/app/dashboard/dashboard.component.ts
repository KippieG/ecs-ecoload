import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrailerViewComponent } from '../trailer-view/trailer-view.component';
import { ReeferMonitorComponent } from '../reefer-monitor/reefer-monitor.component';
import { SignalRService } from '../shared/services/signalr.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TrailerViewComponent, ReeferMonitorComponent],
  template: `
    <div class="dashboard">
      <header class="app-header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-ecs">ECS</span>
            <span class="logo-sep">|</span>
            <span class="logo-app">EcoLoad & Temp Optimizer</span>
          </div>
          <div class="header-sub">Haven van Zeebrugge · Supply Chain Intelligence</div>
        </div>
        <div class="header-right">
          <div class="connection-status" [class.connected]="connected">
            <span class="dot"></span>
            {{ connected ? 'Live verbinding actief' : 'Verbinding verbroken' }}
          </div>
          <div class="header-meta">{{ now | date:'EEEE d MMMM yyyy · HH:mm' }}</div>
        </div>
      </header>

      <main class="main-content">
        <div class="kpi-bar">
          <div class="kpi">
            <div class="kpi-value">1.024</div>
            <div class="kpi-label">Koelcontainers actief</div>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi">
            <div class="kpi-value">98,2%</div>
            <div class="kpi-label">On-time delivery (48u UK)</div>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi green">
            <div class="kpi-value">12.400 kg</div>
            <div class="kpi-label">CO₂ bespaard deze week</div>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi">
            <div class="kpi-value">47</div>
            <div class="kpi-label">Actieve ritten UK</div>
          </div>
        </div>

        <div class="panels">
          <div class="panel panel-trailer">
            <app-trailer-view></app-trailer-view>
          </div>
          <div class="panel panel-reefer">
            <app-reefer-monitor></app-reefer-monitor>
          </div>
        </div>
      </main>

      <footer class="app-footer">
        ECS European Containers nv · Baron de Maerelaan 155 · 8380 Zeebrugge
        <span class="footer-tech">Gebouwd op .NET 8 · Angular 17 · SignalR · Docker</span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #0a0f1e; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }

    .app-header {
      background: linear-gradient(135deg, #0d1b2e 0%, #1a2a4a 100%);
      border-bottom: 1px solid #1e3a5f;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-ecs { font-size: 1.5rem; font-weight: 900; color: #3b82f6; letter-spacing: 2px; }
    .logo-sep { color: #334155; font-size: 1.2rem; }
    .logo-app { font-size: 1rem; font-weight: 600; color: #94a3b8; }
    .header-sub { font-size: 0.72rem; color: #475569; margin-top: 2px; }

    .header-right { text-align: right; }
    .connection-status {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; color: #ef4444; margin-bottom: 4px;
    }
    .connection-status.connected { color: #4ade80; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .header-meta { font-size: 0.72rem; color: #475569; }

    .main-content { padding: 24px 32px; max-width: 1600px; margin: 0 auto; }

    .kpi-bar {
      display: flex;
      align-items: center;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px 28px;
      margin-bottom: 24px;
      gap: 0;
    }
    .kpi { flex: 1; text-align: center; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #e2e8f0; }
    .kpi.green .kpi-value { color: #4ade80; }
    .kpi-label { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
    .kpi-divider { width: 1px; background: #334155; height: 40px; margin: 0 8px; }

    .panels { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .panel {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      padding: 20px 24px;
    }

    .app-footer {
      text-align: center;
      padding: 16px;
      font-size: 0.7rem;
      color: #334155;
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: center;
      gap: 24px;
    }
    .footer-tech { color: #1e3a5f; }

    @media (max-width: 1100px) {
      .panels { grid-template-columns: 1fr; }
      .kpi-bar { flex-wrap: wrap; gap: 16px; }
      .kpi-divider { display: none; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  connected = false;
  now = new Date();

  constructor(private signalr: SignalRService) {}

  async ngOnInit() {
    await this.signalr.start();
    this.signalr.connected$.subscribe(s => this.connected = s);
    this.connected = true;
    setInterval(() => this.now = new Date(), 1000);
  }
}
