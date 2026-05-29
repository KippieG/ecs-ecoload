import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../shared/services/api.service';
import { Shipment } from '../shared/models/shipment.model';

@Component({
  selector: 'app-customs-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="customs-panel">
      <div class="section-header">
        <h2>Brexit & Douane Status</h2>
        <div class="summary-badges">
          <span class="badge badge-green">{{ clearedCount }} vrijgegeven</span>
          <span class="badge badge-red">{{ blockedCount }} geblokkeerd</span>
        </div>
      </div>

      <div class="shipments-list">
        <div *ngFor="let s of shipments" class="shipment-row" [class]="'status-' + s.status.toLowerCase()">
          <div class="shipment-main">
            <div class="shipment-left">
              <div class="shipment-num">{{ s.shipmentNumber }}</div>
              <div class="shipment-client">{{ s.client }}</div>
            </div>
            <div class="route">
              <span class="flag">{{ getFlag(s.originCountry) }}</span>
              <span class="route-arrow">→</span>
              <span class="flag">{{ getFlag(s.destinationCountry) }}</span>
              <span *ngIf="s.isUKBound" class="brexit-tag">Brexit</span>
            </div>
            <div class="shipment-meta">
              <span>{{ s.weightKg | number:'1.0-0' }} kg</span>
              <span>€{{ s.goodsValueEur | number:'1.0-0' }}</span>
            </div>
            <div class="status-col">
              <span class="status-pill" [class]="'pill-' + s.status.toLowerCase()">
                {{ statusLabel(s.status) }}
              </span>
            </div>
          </div>

          <div *ngIf="s.blockReasons.length > 0" class="block-reasons">
            <div *ngFor="let reason of s.blockReasons" class="block-reason">
              <span class="reason-icon">✗</span> {{ reason }}
            </div>
          </div>

          <div class="documents">
            <span *ngFor="let doc of allDocTypes" class="doc-tag" [class.doc-present]="hasDoc(s, doc)" [class.doc-missing]="!hasDoc(s, doc) && s.isUKBound">
              {{ doc }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customs-panel { padding: 0 0 24px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .section-header h2 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #e2e8f0; }
    .summary-badges { display: flex; gap: 8px; }
    .badge { font-size: 0.72rem; padding: 4px 10px; border-radius: 999px; font-weight: 600; }
    .badge-green { background: #052e16; color: #4ade80; border: 1px solid #166534; }
    .badge-red   { background: #450a0a; color: #f87171; border: 1px solid #7f1d1d; }

    .shipments-list { display: flex; flex-direction: column; gap: 10px; }

    .shipment-row {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 12px 14px;
      transition: border-color 0.2s;
    }
    .shipment-row.status-blocked { border-color: #7f1d1d; background: #1c1010; }
    .shipment-row.status-cleared { border-color: #166534; }

    .shipment-main { display: flex; align-items: center; gap: 16px; }
    .shipment-left { min-width: 130px; }
    .shipment-num { font-size: 0.75rem; font-weight: 700; color: #38bdf8; font-family: monospace; }
    .shipment-client { font-size: 0.8rem; color: #cbd5e1; margin-top: 1px; }

    .route { display: flex; align-items: center; gap: 6px; font-size: 1rem; }
    .route-arrow { color: #475569; font-size: 0.8rem; }
    .brexit-tag {
      font-size: 0.6rem; background: #1e3a8a; color: #93c5fd;
      padding: 1px 6px; border-radius: 4px; font-weight: 700;
    }

    .shipment-meta { display: flex; flex-direction: column; gap: 2px; margin-left: auto; }
    .shipment-meta span { font-size: 0.72rem; color: #64748b; }

    .status-col { min-width: 110px; text-align: right; }
    .status-pill { font-size: 0.72rem; padding: 3px 10px; border-radius: 999px; font-weight: 600; }
    .pill-cleared { background: #052e16; color: #4ade80; }
    .pill-blocked { background: #450a0a; color: #f87171; }
    .pill-pending { background: #1c1a08; color: #fbbf24; }

    .block-reasons { margin-top: 10px; padding: 8px 10px; background: #0f172a; border-radius: 6px; }
    .block-reason { font-size: 0.75rem; color: #fca5a5; display: flex; align-items: flex-start; gap: 6px; padding: 2px 0; }
    .reason-icon { color: #ef4444; flex-shrink: 0; }

    .documents { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    .doc-tag { font-size: 0.65rem; padding: 2px 8px; border-radius: 4px; background: #1e293b; color: #475569; border: 1px solid #334155; }
    .doc-present { background: #052e16; color: #86efac; border-color: #166534; }
    .doc-missing { background: #450a0a; color: #f87171; border-color: #7f1d1d; }
  `]
})
export class CustomsCheckComponent implements OnInit {
  shipments: Shipment[] = [];
  readonly allDocTypes = ['EUR1', 'T1', 'CMR', 'PackingList', 'HealthCertificate'];

  get clearedCount() { return this.shipments.filter(s => s.status === 'Cleared').length; }
  get blockedCount()  { return this.shipments.filter(s => s.status === 'Blocked').length; }

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getShipments().subscribe(data => this.shipments = data);
  }

  hasDoc(s: Shipment, doc: string): boolean {
    return s.documents.includes(doc as any);
  }

  getFlag(code: string): string {
    const flags: Record<string, string> = { BE: '🇧🇪', GB: '🇬🇧', NL: '🇳🇱', DE: '🇩🇪', FR: '🇫🇷' };
    return flags[code] ?? code;
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      Cleared: '✓ Vrijgegeven',
      Blocked: '✗ Geblokkeerd',
      Pending: '⏳ In behandeling',
      InspectionRequired: '⚠ Inspectie vereist'
    };
    return labels[status] ?? status;
  }
}
