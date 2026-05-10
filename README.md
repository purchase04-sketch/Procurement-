# ProcureSmart AI: Enterprise Procurement & Predictive Planning Hub

## System Overview
A high-performance, centralized procurement control hub designed specifically for agricultural manufacturing operations. This system integrates real-time KPI tracking, predictive inventory forecasting, and supplier performance management into a unified, scalable platform.

## Architecture & Data Flow
The system is built on a **Centralized Data Architecture** principle:
1. **Master Data Source (`data.js`)**: All calculations, charts, and tables are driven by a single source of truth.
2. **Dynamic UI (`app.js`)**: A state-driven interface that refreshes instantly when the data source is updated or a new planning month is selected.
3. **Forecasting Engine**: Uses 12-month historical consumption trends to project demand for the next 2 months, calculating reorder points and suggested order quantities automatically.

## Key Modules
### 1. Procurement KPI Dashboard
- **OTD (On-Time Delivery)**: Real-time tracking of supplier delivery performance.
- **Spend Analysis**: Visual breakdown of monthly procurement expenditures.
- **Critical Alerts**: Traffic-light system (Red/Amber/Green) for high-risk inventory items.

### 2. Inventory Planning & Predictive Forecasting
- **Consumption-based Trends**: Analyzes historical demand to predict future needs.
- **Safety Stock Logic**: Automated calculation of safety buffers based on lead times and demand volatility.
- **Stockout Prevention**: Alerts for items reaching critical reorder points.

### 3. Cost Saving Management
- **PPV & Negotiation Tracking**: Monitors savings achieved through direct negotiations and purchase price variance.
- **Localization & Alternative Sourcing**: Tracks savings from supply chain optimization.

### 4. Supplier Performance Management
- **Scorecards**: Multidimensional ranking based on OTD, Quality, and Compliance.
- **Risk Scoring**: Identifies high-risk suppliers before they impact the production line.

## Implementation Roadmap
1. **Phase 1: Foundation (Current)**
   - Establishment of the centralized data hub and core dashboard visuals.
   - Implementation of basic forecasting logic.
2. **Phase 2: ERP Integration**
   - Connecting the `Data Hub` to live ERP/SAP PR/PO feeds via API.
3. **Phase 3: AI Optimization**
   - Implementing seasonal demand adjustment factors (e.g., harvesting seasons, planting periods).
   - Enhancing the recommendation engine with multi-supplier Share of Business (SOB) logic.

## Usage Instructions
- **System Refresh**: Use the "Refresh System" button to synchronize with the latest data uploads.
- **Planning Mode**: Use the "Planning Month" selector to toggle between current operations and future projections.
- **Data Edits**: Navigate to "Data Sources" to perform direct edits on the master inventory or export data to Excel for external reporting.

---
*Designed by Antigravity AI for Enterprise Supply Chain Excellence.*
