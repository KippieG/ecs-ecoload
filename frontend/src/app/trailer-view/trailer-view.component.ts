import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/services/api.service';
import { ConsolidationResult, LoadedPallet } from '../shared/models/trailer.model';

@Component({
  selector: 'app-trailer-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trailer-view">
      <div class="section-header">
        <h2>Trailer Lading Optimizer</h2>
        <button class="btn-demo" (click)="runDemo()" [disabled]="loading">
          {{ loading ? 'Optimaliseren...' : '▶ Demo Optimalisatie' }}
        </button>
      </div>

      <div *ngIf="result" class="result-container">
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ result.trailer.volumeUtilizationPct }}%</div>
            <div class="stat-label">Volume benut</div>
            <div class="stat-bar"><div class="stat-fill" [style.width.%]="result.trailer.volumeUtilizationPct"></div></div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ result.trailer.totalWeightKg | number:'1.0-0' }} kg</div>
            <div class="stat-label">Totaal gewicht</div>
          </div>
          <div class="stat-card eco">
            <div class="stat-value">{{ result.estimatedCo2SavedKg | number:'1.0-0' }} kg</div>
            <div class="stat-label">CO₂ bespaard</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ result.tripsSaved }}</div>
            <div class="stat-label">Ritten bespaard</div>
          </div>
        </div>

        <div class="summary-box">{{ result.optimizationSummary }}</div>

        <div class="trailer-label">
          <span class="trailer-num">{{ result.trailer.trailerNumber }}</span>
          <span class="trailer-dest">→ {{ result.trailer.destination }}</span>
          <span class="trailer-height">Super Mega Trailer (360cm)</span>
        </div>

        <div class="trailer-visual">
          <div class="trailer-outline">
            <div class="height-marker">360cm ↕</div>
            <div class="pallet-grid">
              <div
                *ngFor="let lp of result.trailer.loadedPallets"
                class="pallet-slot"
                [class]="'cargo-' + lp.pallet.cargoType.toLowerCase()"
                [title]="getPalletTooltip(lp)"
                [style.height.px]="getPalletHeight(lp)"
              >
                <span class="pallet-client">{{ lp.pallet.client.split(' ')[0] }}</span>
                <span class="pallet-weight">{{ lp.pallet.weightKg | number:'1.0-0' }}kg</span>
              </div>
            </div>
          </div>
        </div>

        <div class="legend">
          <span class="legend-item cargo-fmcg">FMCG</span>
          <span class="legend-item cargo-ambient">Ambient</span>
          <span class="legend-item cargo-chilled">Gekoeld</span>
          <span class="legend-item cargo-frozen">Diepvries</span>
        </div>

        <div *ngIf="result.unassignedPallets.length > 0" class="unassigned">
          <span class="unassigned-count">{{ result.unassignedPallets.length }} pallets niet geladen</span>
          <span class="unassigned-hint">(extra trailer nodig)</span>
        </div>
      </div>

      <div *ngIf="!result && !loading" class="empty-state">
        <div class="empty-icon">🚛</div>
        <p>Klik op "Demo Optimalisatie" om de ConsolidationEngine te starten</p>
        <p class="empty-sub">28 demo-pallets worden gesorteerd op gewicht & volume voor maximale benutting van de 3m60 Super Mega Trailer</p>
      </div>
    </div>
  `,
  styles: [`
    .trailer-view { padding: 0 0 24px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }

    .btn-demo {
      background: linear-gradient(135deg, #1d4ed8, #3b82f6);
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn-demo:hover { opacity: 0.85; }
    .btn-demo:disabled { opacity: 0.5; cursor: not-allowed; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
    .stat-card {
      background: #1e293b;
      border-radius: 10px;
      padding: 12px 14px;
      border: 1px solid #334155;
    }
    .stat-card.eco { border-color: #166534; background: #052e16; }
    .stat-value { font-size: 1.3rem; font-weight: 700; color: #e2e8f0; }
    .stat-card.eco .stat-value { color: #4ade80; }
    .stat-label { font-size: 0.7rem; color: #64748b; margin-top: 2px; }
    .stat-bar { height: 3px; background: #0f172a; border-radius: 2px; margin-top: 8px; overflow: hidden; }
    .stat-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4); border-radius: 2px; }

    .summary-box {
      background: #0f172a;
      border: 1px solid #1e3a5f;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 0.78rem;
      color: #94a3b8;
      margin-bottom: 14px;
      line-height: 1.5;
    }

    .trailer-label { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
    .trailer-num { font-size: 0.8rem; font-weight: 700; color: #38bdf8; font-family: monospace; }
    .trailer-dest { font-size: 0.8rem; color: #94a3b8; }
    .trailer-height { font-size: 0.7rem; background: #1e3a5f; color: #60a5fa; padding: 2px 8px; border-radius: 4px; margin-left: auto; }

    .trailer-visual { margin-bottom: 12px; }
    .trailer-outline {
      border: 2px solid #334155;
      border-radius: 8px;
      padding: 12px;
      background: #0f172a;
      position: relative;
      min-height: 160px;
    }
    .height-marker { position: absolute; left: -48px; top: 50%; transform: translateY(-50%); font-size: 0.65rem; color: #475569; writing-mode: vertical-rl; }

    .pallet-grid {
      display: grid;
      grid-template-columns: repeat(11, 1fr);
      gap: 3px;
    }
    .pallet-slot {
      border-radius: 4px;
      padding: 2px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 40px;
      cursor: default;
      transition: transform 0.15s;
      overflow: hidden;
    }
    .pallet-slot:hover { transform: scale(1.08); z-index: 2; }
    .pallet-client { font-size: 0.55rem; font-weight: 700; text-align: center; line-height: 1.1; }
    .pallet-weight { font-size: 0.5rem; opacity: 0.7; }

    .cargo-fmcg { background: #1e3a8a; color: #93c5fd; }
    .cargo-ambient { background: #14532d; color: #86efac; }
    .cargo-chilled { background: #164e63; color: #67e8f9; }
    .cargo-frozen { background: #1e1b4b; color: #a5b4fc; }

    .legend { display: flex; gap: 10px; margin-bottom: 12px; }
    .legend-item { font-size: 0.7rem; padding: 3px 10px; border-radius: 4px; }

    .unassigned {
      display: flex; gap: 8px; align-items: center;
      background: #292216; border: 1px solid #92400e; border-radius: 8px;
      padding: 8px 14px;
    }
    .unassigned-count { font-size: 0.8rem; color: #fbbf24; font-weight: 600; }
    .unassigned-hint { font-size: 0.75rem; color: #92400e; }

    .empty-state { text-align: center; padding: 40px 20px; color: #475569; }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-state p { margin: 4px 0; font-size: 0.9rem; }
    .empty-sub { font-size: 0.78rem; color: #334155; max-width: 480px; margin: 8px auto 0; }
  `]
})
export class TrailerViewComponent implements OnInit {
  result: ConsolidationResult | null = null;
  loading = false;

  constructor(private api: ApiService) {}

  ngOnInit() {}

  runDemo() {
    this.loading = true;
    this.api.runDemoOptimization().subscribe({
      next: res => { this.result = res; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getPalletHeight(lp: LoadedPallet): number {
    return Math.max(38, lp.pallet.heightCm * 0.28);
  }

  getPalletTooltip(lp: LoadedPallet): string {
    return `${lp.pallet.client}\n${lp.pallet.weightKg}kg · ${lp.pallet.heightCm}cm\nLaag ${lp.layer}`;
  }
}
