import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrailerViewComponent } from '../trailer-view/trailer-view.component';
import { ReeferMonitorComponent } from '../reefer-monitor/reefer-monitor.component';
import { CustomsCheckComponent } from '../customs-check/customs-check.component';
import { SignalRService } from '../shared/services/signalr.service';

type ActiveTab = 'trailer' | 'reefer' | 'customs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TrailerViewComponent, ReeferMonitorComponent, CustomsCheckComponent],
  template: `
    <div class="dashboard">
      <header class="app-header">
        <div class="header-left">
          <div class="logo">
            <div class="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect width="28" height="28" rx="6" fill="#1d4ed8"/>
                <path d="M4 20 L14 8 L24 20" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="14" cy="20" r="2" fill="white"/>
              </svg>
            </div>
            <div>
              <div class="logo-title"><span class="logo-ecs">ECS</span> EcoLoad</div>
              <div class="logo-sub">Supply Chain Intelligence · Zeebrugge</div>
            </div>
          </div>
        </div>
        <div class="header-center">
          <nav class="tab-nav">
            <button class="tab-btn" [class.active]="tab === 'trailer'" (click)="tab = 'trailer'">
              <span class="tab-icon">🚛</span> Lading Optimizer
            </button>
            <button class="tab-btn" [class.active]="tab === 'reefer'" (click)="tab = 'reefer'">
              <span class="tab-icon">🌡️</span> Koelcontainers
              <span *ngIf="criticalCount > 0" class="alert-dot">{{ criticalCount }}</span>
            </button>
            <button class="tab-btn" [class.active]="tab === 'customs'" (click)="tab = 'customs'">
              <span class="tab-icon">📋</span> Brexit & Douane
            </button>
          </nav>
        </div>
        <div class="header-right">
          <div class="connection-status" [class.connected]="connected">
            <span class="dot"></span>
            {{ connected ? 'Live' : 'Offline' }}
          </div>
          <div class="header-time">{{ now | date:'HH:mm:ss' }}</div>
        </div>
      </header>

      <div class="kpi-bar">
        <div class="kpi">
          <div class="kpi-value">1.024</div>
          <div class="kpi-label">Koelcontainers actief</div>
        </div>
        <div class="kpi-div"></div>
        <div class="kpi">
          <div class="kpi-value">98,2%</div>
          <div class="kpi-label">On-time delivery 48u UK</div>
        </div>
        <div class="kpi-div"></div>
        <div class="kpi green">
          <div class="kpi-value">12.400 kg</div>
          <div class="kpi-label">CO₂ bespaard deze week</div>
        </div>
        <div class="kpi-div"></div>
        <div class="kpi">
          <div class="kpi-value">47</div>
          <div class="kpi-label">Actieve UK-ritten</div>
        </div>
        <div class="kpi-div"></div>
        <div class="kpi" [class.kpi-warn]="blockedShipments > 0">
          <div class="kpi-value">{{ blockedShipments }}</div>
          <div class="kpi-label">Douane geblokkeerd</div>
        </div>
      </div>

      <main class="main-content">
        <div class="panel" [hidden]="tab !== 'trailer'">
          <app-trailer-view></app-trailer-view>
        </div>
        <div class="panel" [hidden]="tab !== 'reefer'">
          <app-reefer-monitor (criticalCountChange)="criticalCount = $event"></app-reefer-monitor>
        </div>
        <div class="panel" [hidden]="tab !== 'customs'">
          <app-customs-check (blockedCountChange)="blockedShipments = $event"></app-customs-check>
        </div>
      </main>

      <footer class="app-footer">
        <span>ECS European Containers nv · Baron de Maerelaan 155 · 8380 Zeebrugge</span>
        <span class="footer-tech">
          .NET 8 &nbsp;·&nbsp; Angular 17 &nbsp;·&nbsp; SignalR &nbsp;·&nbsp; DDD &nbsp;·&nbsp; Docker
        </span>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #070d1a; color: #e2e8f0; font-family: 'Inter', system-ui, sans-serif; }

    .app-header {
      background: linear-gradient(180deg, #0d1b35 0%, #0f1f3d 100%);
      border-bottom: 1px solid #1e3a5f;
      padding: 0 28px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      height: 64px;
    }

    .header-left { display: flex; align-items: center; }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo-icon { display: flex; align-items: center; }
    .logo-title { font-size: 1rem; font-weight: 700; color: #e2e8f0; }
    .logo-ecs { color: #3b82f6; }
    .logo-sub { font-size: 0.62rem; color: #475569; margin-top: 1px; }

    .header-center { display: flex; justify-content: center; }
    .tab-nav { display: flex; gap: 4px; background: #0a1628; border: 1px solid #1e3a5f; border-radius: 10px; padding: 4px; }
    .tab-btn {
      display: flex; align-items: center; gap: 6px; position: relative;
      background: transparent; border: none; color: #64748b; padding: 6px 14px;
      border-radius: 7px; cursor: pointer; font-size: 0.8rem; font-weight: 500;
      transition: all 0.15s; white-space: nowrap; font-family: inherit;
    }
    .tab-btn:hover { color: #94a3b8; background: #1e293b; }
    .tab-btn.active { background: #1d4ed8; color: #fff; }
    .tab-icon { font-size: 0.9rem; }
    .alert-dot {
      background: #ef4444; color: white; font-size: 0.6rem; font-weight: 700;
      min-width: 16px; height: 16px; border-radius: 999px;
      display: flex; align-items: center; justify-content: center; padding: 0 3px;
    }

    .header-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 2px; }
    .connection-status { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; color: #ef4444; }
    .connection-status.connected { color: #4ade80; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .header-time { font-size: 1rem; font-weight: 600; color: #475569; font-variant-numeric: tabular-nums; }

    .kpi-bar {
      display: flex; align-items: center;
      background: #0d1b2e; border-bottom: 1px solid #1e3a5f;
      padding: 12px 32px;
    }
    .kpi { flex: 1; text-align: center; }
    .kpi-value { font-size: 1.3rem; font-weight: 700; color: #cbd5e1; }
    .kpi.green .kpi-value { color: #4ade80; }
    .kpi.kpi-warn .kpi-value { color: #f87171; }
    .kpi-label { font-size: 0.65rem; color: #475569; margin-top: 1px; }
    .kpi-div { width: 1px; background: #1e3a5f; height: 32px; margin: 0 8px; }

    .main-content { padding: 24px 32px; max-width: 1400px; margin: 0 auto; }
    .panel { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 22px 26px; }

    .app-footer {
      display: flex; justify-content: space-between;
      padding: 12px 32px; font-size: 0.65rem; color: #1e3a5f;
      border-top: 1px solid #0d1b2e;
    }
    .footer-tech { color: #334155; }

    @media (max-width: 900px) {
      .app-header { grid-template-columns: 1fr 1fr; height: auto; padding: 12px 16px; flex-wrap: wrap; }
      .header-center { grid-column: 1 / -1; order: 3; padding-bottom: 8px; }
      .tab-btn { font-size: 0.72rem; padding: 5px 10px; }
      .kpi-bar { flex-wrap: wrap; gap: 12px; }
      .kpi-div { display: none; }
      .main-content { padding: 16px; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  tab: ActiveTab = 'trailer';
  connected = false;
  criticalCount = 0;
  blockedShipments = 2; // hardcoded KPI voor demo
  now = new Date();

  constructor(private signalr: SignalRService) {}

  async ngOnInit() {
    await this.signalr.start();
    this.signalr.connected$.subscribe(s => this.connected = s);
    this.connected = true;
    setInterval(() => this.now = new Date(), 1000);
  }
}
