import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ApiService } from '../shared/services/api.service';
import { SignalRService } from '../shared/services/signalr.service';
import { ReeferContainer, CriticalAlert } from '../shared/models/reefer.model';

@Component({
  selector: 'app-reefer-monitor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reefer-monitor">
      <div class="section-header">
        <h2>Koelcontainer Monitoring</h2>
        <span class="live-badge">● LIVE</span>
      </div>

      <div *ngFor="let alert of alerts" class="critical-alert">
        <span class="alert-icon">⚠</span> {{ alert.message }}
      </div>

      <div class="reefer-grid">
        <div *ngFor="let r of reefers" class="reefer-card" [class]="'status-' + r.status.toLowerCase()">
          <div class="reefer-header">
            <span class="container-num">{{ r.containerNumber }}</span>
            <span class="status-badge" [class]="'badge-' + r.status.toLowerCase()">{{ r.status }}</span>
          </div>
          <div class="reefer-client">{{ r.client }} → {{ r.destination }}</div>

          <div class="temp-display">
            <div class="current-temp" [class.out-of-range]="r.isOutOfRange">
              {{ r.currentTemp | number:'1.1-1' }}°C
            </div>
            <div class="target-range">doel: {{ r.targetTempMin }}°C tot {{ r.targetTempMax }}°C</div>
          </div>

          <div class="temp-bar-container">
            <div class="temp-bar" [style.width.%]="getTempBarPct(r)" [class]="'bar-' + r.status.toLowerCase()"></div>
          </div>

          <div class="reefer-footer">
            <span *ngIf="r.isOutOfRange" class="deviation">
              ↑ {{ r.deviationCelsius | number:'1.1-1' }}°C afwijking
            </span>
            <span class="last-update">{{ r.lastReading | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reefer-monitor { padding: 0 0 24px; }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .section-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }
    .live-badge { font-size: 0.7rem; color: #48bb78; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    .critical-alert {
      background: linear-gradient(135deg, #7f1d1d, #991b1b);
      border: 1px solid #ef4444;
      border-radius: 8px;
      padding: 10px 16px;
      margin-bottom: 12px;
      color: #fca5a5;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .alert-icon { font-size: 1rem; }

    .reefer-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }

    .reefer-card {
      background: #1e293b;
      border-radius: 12px;
      padding: 14px;
      border: 1px solid #334155;
      transition: all 0.3s ease;
    }
    .reefer-card.status-critical { border-color: #ef4444; background: #1c1010; }
    .reefer-card.status-warning { border-color: #f59e0b; }

    .reefer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .container-num { font-size: 0.75rem; font-weight: 700; color: #94a3b8; font-family: monospace; }
    .status-badge { font-size: 0.65rem; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
    .badge-normal { background: #064e3b; color: #6ee7b7; }
    .badge-warning { background: #451a03; color: #fbbf24; }
    .badge-critical { background: #450a0a; color: #f87171; animation: pulse 1s infinite; }

    .reefer-client { font-size: 0.75rem; color: #64748b; margin-bottom: 12px; }

    .temp-display { text-align: center; margin-bottom: 8px; }
    .current-temp { font-size: 2rem; font-weight: 700; color: #38bdf8; transition: color 0.3s; }
    .current-temp.out-of-range { color: #f87171; }
    .target-range { font-size: 0.7rem; color: #64748b; margin-top: 2px; }

    .temp-bar-container { height: 4px; background: #0f172a; border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
    .temp-bar { height: 100%; border-radius: 2px; transition: width 0.5s ease; }
    .bar-normal { background: #10b981; }
    .bar-warning { background: #f59e0b; }
    .bar-critical { background: #ef4444; }

    .reefer-footer { display: flex; justify-content: space-between; align-items: center; }
    .deviation { font-size: 0.7rem; color: #f87171; }
    .last-update { font-size: 0.65rem; color: #475569; }
  `]
})
export class ReeferMonitorComponent implements OnInit, OnDestroy {
  reefers: ReeferContainer[] = [];
  alerts: CriticalAlert[] = [];
  private subs: Subscription[] = [];

  constructor(private api: ApiService, private signalr: SignalRService) {}

  async ngOnInit() {
    this.api.getReefers().subscribe(data => {
      this.reefers = data;
      data.forEach(r => this.signalr.subscribeToReefer(r.id));
    });

    this.subs.push(
      this.signalr.temperatureUpdate$.subscribe(update => {
        const reefer = this.reefers.find(r => r.id === update.id);
        if (reefer) {
          reefer.currentTemp = update.currentTemp;
          reefer.status = update.status;
          reefer.deviationCelsius = update.deviationCelsius;
          reefer.isOutOfRange = reefer.deviationCelsius > 0;
          reefer.lastReading = update.timestamp;
        }
      }),
      this.signalr.criticalAlert$.subscribe(alert => {
        this.alerts.unshift(alert);
        if (this.alerts.length > 3) this.alerts.pop();
        setTimeout(() => this.alerts = this.alerts.filter(a => a !== alert), 8000);
      })
    );
  }

  getTempBarPct(r: ReeferContainer): number {
    const range = Math.abs(r.targetTempMax - r.targetTempMin) * 3;
    const offset = r.currentTemp - r.targetTempMin;
    return Math.min(100, Math.max(0, (offset / range) * 100));
  }

  ngOnDestroy() { this.subs.forEach(s => s.unsubscribe()); }
}
