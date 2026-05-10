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
                <th>LY Consumption</th>
                <th>Seasonality</th>
                <th>Forecast Qty</th>
                <th>Current Stock</th>
                <th>Safety Stock</th>
                <th>Net Req.</th>
                <th>Suggested Order</th>
                <th>Supplier Alloc. / Rate / Val / Lead</th>
                <th>Risk / Alerts</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>Calculating planning data...</td></tr>
              ) : data.map((item, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{item.itemCode}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.itemName}</div>
                  </td>
                  <td>{item.forecastQty}</td>
                  <td>
                    <select style={{ background: 'var(--bg-input)', border: 'none', color: '#fff', fontSize: '0.75rem', padding: '2px 4px' }}>
                      <option>Auto (1.0)</option>
                      <option>Manual</option>
                    </select>
                  </td>
                  <td style={{ fontWeight: '600' }}>{item.forecastQty}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.safetyStock}</td>
                  <td style={{ fontWeight: '600' }}>{item.netRequirement}</td>
                  <td style={{ color: 'var(--primary)', fontWeight: '700' }}>{item.suggestedOrderQty}</td>
                  <td>
                    {item.allocations?.map((a, j) => (
                      <div key={j} style={{ fontSize: '0.65rem', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '4px', marginBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '600' }}>{a.supplierCode}</span>
                          <span>{a.percentage}% ({a.allocatedQty})</span>
                        </div>
                        <div style={{ color: 'var(--text-dim)', display: 'flex', gap: '8px' }}>
                          <span>Rate: ₹{a.rate}</span>
                          <span>Val: ₹{a.value.toLocaleString()}</span>
                          <span>LD: {a.leadDays}d</span>
                        </div>
                      </div>
                    ))}
                  </td>
                  <td>
                    <RiskBadge level={item.risk} />
                    <div style={{ fontSize: '0.65rem', marginTop: '4px', color: 'var(--text-dim)' }}>
                      {item.currentStock < item.safetyStock && <div style={{ color: 'var(--danger)' }}>Stockout Risk</div>}
                      {item.currentStock > item.safetyStock * 5 && <div style={{ color: 'var(--warning)' }}>Excess Risk</div>}
                      <div style={{ fontStyle: 'italic', color: 'var(--primary)' }}>Auto-Recomm.</div>
                    </div>
                  </td>
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
