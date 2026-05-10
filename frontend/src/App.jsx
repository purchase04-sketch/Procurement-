import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Real Pages
import Dashboard from './pages/Dashboard';
import DataSources from './pages/DataSources';
import InventoryMaster from './pages/InventoryMaster';
import InventoryPlanning from './pages/InventoryPlanning';
import CostSavings from './pages/CostSavings';
import SupplierPerformance from './pages/SupplierPerformance';
import MonthlySchedule from './pages/MonthlySchedule';

// Reports Placeholder
const Reports = () => (
  <div className="p-8">
    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '10px' }}>Reports Center</h2>
    <p style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Download processed workbooks and module-wise summaries</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h4>Full Procurement Workbook</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '10px 0' }}>Includes all calculations, dashboards and planning outputs.</p>
        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Download .xlsx</button>
      </div>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h4>Inventory Risk Report</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '10px 0' }}>Critical items and stockout risk summary.</p>
        <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Download .csv</button>
      </div>
    </div>
  </div>
);

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Router>
      <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <Sidebar />
        
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <TopBar onRefresh={handleRefresh} />
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }} key={refreshKey}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/data-sources" element={<DataSources />} />
              <Route path="/inventory-master" element={<InventoryMaster />} />
              <Route path="/inventory-planning" element={<InventoryPlanning />} />
              <Route path="/cost-savings" element={<CostSavings />} />
              <Route path="/supplier-performance" element={<SupplierPerformance />} />
              <Route path="/monthly-schedule" element={<MonthlySchedule />} />
              <Route path="/reports" element={<Reports />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
