# ECS EcoLoad & Temp Optimizer

> **Portfolioproject** — gebouwd als concrete demonstratie van domeinkennis voor de functie **Software Developer** bij ECS European Containers (Zeebrugge).

Een interne plannings- en monitoring tool die twee kritieke uitdagingen in de ECS supply chain aanpakt:

1. **Lading-optimalisatie** van Super Mega Trailers (3m60) richting UK retail via een DDD-gebaseerde `ConsolidationEngine`
2. **Live temperatuurmonitoring** van koelcontainers (reefers) via een Event-Driven event-stroom en SignalR WebSockets

---

## Waarom dit project?

ECS is marktleider in consolidatievervoer naar Britse supermarkten (Tesco, Sainsbury's, ASDA, Morrisons, Waitrose) met een 48-uur leveringsgarantie. Hun unique selling point is het slimme mengen van zware en lichte goederen in **Super Mega Trailers** (3m60 hoog) via automatische skimming-robots — minder ritten, minder CO₂, hogere bezettingsgraad.

Tegelijkertijd beheert ECS meer dan **1.000 koelcontainers** voor temperatuurgevoelige goederen (fresh, chilled, frozen). Een temperatuurafwijking van zelfs 2°C kan een volledige lading voor een supermarkt onverkoopbaar maken.

Dit project simuleert de interne tooling die een ECS-planner dagelijks zou gebruiken.

---

## Tech Stack

| Laag | Technologie | Waarom |
|------|-------------|--------|
| **Backend** | .NET 8 · C# · ASP.NET Core | Hoofdvacature-eis |
| **Architectuur** | Domain-Driven Design (DDD) · Clean Architecture | Schaalbaar, testbaar, SOLID |
| **Real-time** | SignalR (WebSockets) | Live temperatuurupdates zonder polling |
| **Frontend** | Angular 17 (Standalone Components) | Hoofdvacature-eis |
| **Containerisatie** | Docker · Docker Compose | Azure-ready, Kubernetes-klaar |
| **API Docs** | Swagger / OpenAPI | Developer-friendly |

---

## Architectuur

```
┌─────────────────────────────────────────────────────┐
│                  Angular Frontend                    │
│  ┌─────────────────────┐  ┌────────────────────┐    │
│  │  Trailer Optimizer   │  │  Reefer Monitor    │    │
│  │  (visuele loading)  │  │  (live temp. gauge) │    │
│  └──────────┬──────────┘  └─────────┬──────────┘    │
└─────────────┼──────────────────────│──────────────┘
              │ HTTP/REST             │ SignalR WS
┌─────────────▼──────────────────────▼──────────────┐
│                   .NET 8 Web API                    │
│  ┌──────────────────┐   ┌──────────────────────┐   │
│  │  Domain Layer    │   │  Application Layer   │   │
│  │  ┌────────────┐  │   │  ┌────────────────┐  │   │
│  │  │Trailer     │  │   │  │ConsolidationSvc│  │   │
│  │  │Pallet      │  │   │  │ReeferSimulator │  │   │
│  │  │Reefer      │  │   │  │(BackgroundSvc) │  │   │
│  │  └────────────┘  │   │  └────────────────┘  │   │
│  └──────────────────┘   └──────────────────────┘   │
└──────────────────────────────────────────────────-──┘
              │ Docker Compose
┌─────────────▼──────────────────────────────────────┐
│           Infrastructure (Azure-ready)              │
│   Docker · Nginx reverse proxy · AKS-ready          │
└─────────────────────────────────────────────────────┘
```

### Domain-Driven Design — Aggregates

| Aggregate | Verantwoordelijkheid |
|-----------|----------------------|
| `Trailer` | Beheert geladen pallets, berekent bezettingsgraad en hoogtebenutting |
| `Pallet` | Valueobject met gewicht, hoogte, type cargo en dichtheid |
| `ReeferContainer` | Bijhoudt huidige/doeltemperatuur, genereert alerts bij afwijking |
| `ConsolidationEngine` | Domeinservice: sorteert pallets op dichtheid (zwaar onderaan, licht bovenaan) |

---

## Kernfunctionaliteiten

### 1. ConsolidationEngine — Lading-algoritme

```csharp
// Sorteert pallets: zwaarst & dichtst onderaan (laag 1), lichtst bovenaan
var sorted = pallets
    .OrderByDescending(p => p.Density)
    .ThenByDescending(p => p.WeightKg)
    .ToList();
```

- Maximale benutting van de **3m60 trailerhoogte**
- Berekent **CO₂-besparing** per geoptimaliseerde rit (gemiddeld 850kg CO₂/rit)
- Rapporteert volumebenutting, totaalgewicht en niet-geplaatste pallets

### 2. Live Reefer Monitoring via SignalR

```
Reefer IoT Simulator (BackgroundService)
    → elke 5 seconden: temperatuurdrift simulatie
    → bij afwijking > 1°C: Warning
    → bij afwijking > 3°C: Critical + broadcast alert naar alle operators
    → Angular dashboard: live update zonder page refresh
```

### 3. Visueel Loading Bay Dashboard

- Angular-grid toont elke pallet als blok (kleurgecodeerd per cargoType)
- Hoogte van blok = proportioneel aan pallethoogte
- Hover = tooltips met client, gewicht, laagnummer
- KPI-balk: bezettingsgraad, CO₂-besparing, on-time delivery

---

## Snel starten

### Vereisten
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(optioneel)*

### Lokaal draaien (zonder Docker)

```bash
# Terminal 1 — Backend
cd backend/src/ECS.EcoLoad.API
dotnet run
# API draait op http://localhost:5000
# Swagger UI: http://localhost:5000/swagger

# Terminal 2 — Frontend
cd frontend
npm install
npm start
# Dashboard: http://localhost:4200
```

### Met Docker Compose

```bash
docker-compose up --build
# Dashboard: http://localhost:4200
# API:       http://localhost:5000/swagger
```

---

## API Endpoints

| Method | Route | Beschrijving |
|--------|-------|--------------|
| `POST` | `/api/trailers/demo` | Voer demo-optimalisatie uit (28 pallets, willekeurige mix) |
| `POST` | `/api/trailers/optimize` | Eigen palletlijst optimaliseren |
| `GET`  | `/api/reefers` | Alle koelcontainers met live temperatuurstatus |
| `GET`  | `/api/reefers/{id}` | Één koelcontainer opvragen |
| `POST` | `/api/reefers/{id}/telemetry` | IoT temperatuurreading doorsturen |
| `WS`   | `/hubs/reefer` | SignalR WebSocket hub |

Volledige documentatie: `http://localhost:5000/swagger`

---

## Projectstructuur

```
ecs-ecoload/
├── backend/
│   └── src/ECS.EcoLoad.API/
│       ├── Domain/              # Pallet, Trailer, ReeferContainer, enums
│       ├── Services/            # ConsolidationEngine, ReeferStore, ReeferSimulator
│       ├── Controllers/         # TrailersController, ReefersController
│       ├── Hubs/                # ReeferHub (SignalR)
│       └── Program.cs
├── frontend/
│   └── src/app/
│       ├── dashboard/           # Hoofd-layout, KPI-balk, verbindingsstatus
│       ├── trailer-view/        # Visueel loading bay + ConsolidationEngine resultaat
│       ├── reefer-monitor/      # Live temperatuurkaarten + kritieke alerts
│       └── shared/
│           ├── models/          # TypeScript interfaces (Pallet, Trailer, Reefer)
│           └── services/        # ApiService (HTTP), SignalRService (WebSocket)
├── docker-compose.yml
└── README.md
```

---

## Roadmap (toekomstige uitbreidingen)

- [ ] **Azure Service Bus** integratie voor echte Event-Driven Architecture tussen microservices
- [ ] **MS SQL Server** met Entity Framework Core (nu: in-memory voor demo)
- [ ] **Douane-module**: Brexit-check simulator (geldig EUR1-certificaat vereist voor UK-transport)
- [ ] **Azure Kubernetes Service (AKS)** deployment met Helm charts
- [ ] **Domain Events**: `PalletLoadedEvent`, `TrailerDispatchedEvent` voor audit trail
- [ ] **Unit tests** met xUnit + Moq op de ConsolidationEngine

---

## Architectuurkeuzes

**Waarom DDD en geen simpele CRUD?**
ECS is een 24/7 logistiek bedrijf. Aparte domeinen (lading vs. temperatuur) kunnen onafhankelijk van elkaar schalen en onderhouden worden. Als de reefer-module een hotfix nodig heeft, mag de planningsmodule daar geen hinder van ondervinden.

**Waarom SignalR in plaats van polling?**
Temperatuurafwijkingen in koelcontainers moeten binnen seconden gemeld worden aan de operator. Polling elke 5s geeft onnodige serverbelasting; SignalR pusht updates enkel wanneer er iets verandert.

**Waarom Docker-first?**
De beschrijving in de vacature vermeldt Kubernetes en Docker als pluspunten. De applicatie is van dag één containerized zodat deployment naar Azure Kubernetes Service (AKS) een minimale stap is.

---

## Over de kandidaat

Gebouwd door **Philippe Godfroy** als concreet bewijs van domeinkennis voor de ECS-vacature Software Developer (Zeebrugge).

> *"Ik zag dat ECS koploper is in het consolideren van ladingen via Super Mega Trailers en meer dan 1.000 koelcontainers beheert voor Britse retailers. Dit project combineert beide uitdagingen in één tool die een ECS-planner direct herkent."*
