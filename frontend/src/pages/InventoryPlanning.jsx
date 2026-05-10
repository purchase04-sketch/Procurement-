import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Filter, Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const RiskBadge = ({ level }) => {
  const colors = {
    High: 'badge-danger',
    Medium: 'badge-warning',
    Low: 'badge-success'
  };
  return <span className={`badge ${colors[level] || 'badge-warning'}`}>{level}</span>;
};

const InventoryPlanning = () => {
  const [data, setData] = useState([]);
  const [viewBy, setViewBy] = useState('Item');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    axios.get(`http://localhost:5000/api/planning/inventory?month=${month}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Inventory Planning</h2>
          <p style={{ color: 'var(--text-dim)' }}>Suggested order quantities and stockout risk analysis</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-input)', padding: '4px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Filter size={16} color="var(--text-dim)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>View by:</span>
            <select 
              value={viewBy}
              onChange={(e) => setViewBy(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Item" style={{ background: '#111' }}>Item Wise</option>
              <option value="Supplier" style={{ background: '#111' }}>Supplier Wise</option>
              <option value="Commodity" style={{ background: '#111' }}>Commodity Wise</option>
              <option value="Month" style={{ background: '#111' }}>Month Wise</option>
            </select>
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th>Item Details</th>
                <th>Consumption (LY)</th>
                <th>Stock Status</th>
                <th>Net Req.</th>
                <th>Suggested Order</th>
                <th>Supplier Allocation</th>
                <th>Risk Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>Calculating planning data...</td></tr>
              ) : data.map((item, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.itemCode}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.itemName}</div>
                  </td>
                  <td style={{ fontSize: '0.9rem' }}>{item.forecastQty}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{item.currentStock} / <span style={{ color: 'var(--text-dim)' }}>{item.safetyStock} (SS)</span></div>
                    <div style={{ width: '100px', height: '4px', background: 'var(--bg-input)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
                       <div style={{ width: `${Math.min(100, (item.currentStock/item.safetyStock)*50)}%`, height: '100%', background: item.currentStock < item.safetyStock ? 'var(--danger)' : 'var(--success)' }}></div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>{item.netRequirement}</td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '700' }}>{item.suggestedOrderQty}</td>
                  <td>
                    {item.allocations?.map((a, j) => (
                      <div key={j} style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '2px' }}>
                        <span>{a.supplierCode}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{a.percentage}% ({a.allocatedQty})</span>
                      </div>
                    ))}
                  </td>
                  <td><RiskBadge level={item.risk} /></td>
                </tr>
              ))}
              {!loading && data.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>No planning data available for selected month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Stockout Alerts</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{data.filter(d => d.risk === 'High').length} items are below safety stock levels.</p>
        </div>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Info size={18} color="var(--warning)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Excess Inventory</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>0 items have stock coverage for more than 120 days.</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryPlanning;
