import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Filter, Download, AlertTriangle, Info, Upload, Search, RefreshCw, Edit3, Save, X } from 'lucide-react';

/* ── FY 26-27 months ── */
const FY_MONTHS = [
  { label: 'April 2026', val: '2026-04' },
  { label: 'May 2026', val: '2026-05' },
  { label: 'June 2026', val: '2026-06' },
  { label: 'July 2026', val: '2026-07' },
  { label: 'August 2026', val: '2026-08' },
  { label: 'September 2026', val: '2026-09' },
  { label: 'October 2026', val: '2026-10' },
  { label: 'November 2026', val: '2026-11' },
  { label: 'December 2026', val: '2026-12' },
  { label: 'January 2027', val: '2027-01' },
  { label: 'February 2027', val: '2027-02' },
  { label: 'March 2027', val: '2027-03' },
];

/* ── Risk Badge ── */
const RiskBadge = ({ level }) => {
  const cls = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
  return <span className={`badge ${cls[level] || 'badge-warning'}`}>{level || 'N/A'}</span>;
};

/* ── Editable Cell ── */
const EditableCell = ({ value, isEditing, onChange, type = 'text', style = {} }) => {
  if (!isEditing) return <span style={style}>{value}</span>;
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
      className="input-field"
      style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem', ...style }}
    />
  );
};

/* ── Dropdown filter component ── */
const FilterSelect = ({ label, value, options, onChange }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', minWidth: '120px' }}
    >
      <option value="" style={{ background: '#111' }}>All</option>
      {options.map(o => <option key={o} value={o} style={{ background: '#111' }}>{o}</option>)}
    </select>
  </div>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */
const InventoryPlanning = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(localStorage.getItem('activeMonth') || '2026-04');
  const [editingRow, setEditingRow] = useState(null);
  const [editValues, setEditValues] = useState({});

  /* Filters */
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterCommodity, setFilterCommodity] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [searchText, setSearchText] = useState('');

  /* ── Fetch planning data ── */
  const fetchPlanning = useCallback(async (month) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/planning/inventory?month=${month}`);
      setData(res.data);
    } catch (err) {
      console.error('Planning fetch error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlanning(selectedMonth);
  }, [selectedMonth, fetchPlanning]);

  /* Listen for global month changes from TopBar */
  useEffect(() => {
    const handleStorage = () => {
      const m = localStorage.getItem('activeMonth');
      if (m && m !== selectedMonth) {
        setSelectedMonth(m);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [selectedMonth]);

  /* ── Month change handler ── */
  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    localStorage.setItem('activeMonth', val);
    window.dispatchEvent(new Event('storage'));
  };

  /* ── Excel Upload ── */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('http://localhost:5000/api/upload/inventoryplanning', formData);
      alert('Upload successful! Planning data will refresh.');
      fetchPlanning(selectedMonth);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
    e.target.value = '';
  };

  /* ── Excel Download ── */
  const handleDownload = () => {
    const exportRows = filteredData.map(item => {
      const alloc = item.allocations?.[0] || {};
      return {
        'Item Code': item.itemCode,
        'Item Name': item.itemName,
        'Month': selectedMonth,
        'LY Same Month Consumption': item.lyConsumption ?? item.forecastQty ?? 0,
        'LY Same Month Schedule': item.lyScheduleQty ?? 0,
        'Current Stock': item.currentStock,
        'Share of Business %': alloc.percentage ?? 0,
        'Supplier Code': alloc.supplierCode ?? '',
        'Supplier Price': alloc.rate ?? 0,
        'Lead Time (Days)': alloc.leadDays ?? item.leadTime ?? 0,
        'Safety Stock': item.safetyStock,
        'Risk Factor': item.riskFactor ?? 1,
        'Forecast Qty': item.forecastQty,
        'Net Requirement': item.netRequirement,
        'Suggested Planning Qty': item.suggestedOrderQty,
        'Approx Planning Value (₹)': alloc.value ?? 0,
        'Risk Status': item.risk,
        'Recommendation': item.recommendation ?? 'Auto-calculated'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Planning');
    XLSX.writeFile(wb, `Inventory_Planning_${selectedMonth}.xlsx`);
  };

  /* ── Inline Editing ── */
  const startEdit = (row) => {
    setEditingRow(row._id || row.itemCode);
    setEditValues({ ...row });
  };
  const cancelEdit = () => {
    setEditingRow(null);
    setEditValues({});
  };
  const saveEdit = async () => {
    try {
      if (editValues._id) {
        await axios.put(`http://localhost:5000/api/inventory/${editValues._id}`, editValues);
      }
      setEditingRow(null);
      fetchPlanning(selectedMonth);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  /* ── Build filter option lists ── */
  const uniqueSuppliers = [...new Set(data.flatMap(d => (d.allocations || []).map(a => a.supplierCode)).filter(Boolean))];
  const uniqueCommodities = [...new Set(data.map(d => d.commodity).filter(Boolean))];
  const uniqueItems = [...new Set(data.map(d => d.itemCode).filter(Boolean))];
  const riskLevels = ['Low', 'Medium', 'High'];

  /* ── Apply filters ── */
  const filteredData = data.filter(item => {
    if (filterSupplier && !(item.allocations || []).some(a => a.supplierCode === filterSupplier)) return false;
    if (filterCommodity && item.commodity !== filterCommodity) return false;
    if (filterItem && item.itemCode !== filterItem) return false;
    if (filterRisk && item.risk !== filterRisk) return false;
    if (searchText) {
      const s = searchText.toLowerCase();
      if (!(item.itemCode || '').toLowerCase().includes(s) && !(item.itemName || '').toLowerCase().includes(s)) return false;
    }
    return true;
  });

  /* ── Summary stats ── */
  const highRiskCount = filteredData.filter(d => d.risk === 'High').length;
  const totalPlanValue = filteredData.reduce((sum, d) => {
    return sum + (d.allocations || []).reduce((s, a) => s + (a.value || 0), 0);
  }, 0);

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Inventory Planning</h2>
          <p style={{ color: 'var(--text-dim)' }}>FY 26-27 supplier-wise & item-wise planning based on FY 25-26 schedule data</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 16px' }}>
            <Upload size={16} /> Upload Planning Excel
            <input type="file" hidden onChange={handleUpload} accept=".xlsx,.xls,.csv" />
          </label>
          <button className="btn-primary" onClick={handleDownload} style={{ padding: '10px 16px' }}>
            <Download size={16} /> Download Excel
          </button>
        </div>
      </div>

      {/* ── Month Selector + Filters Bar ── */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          {/* Month */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Planning Month</span>
            <select
              value={selectedMonth}
              onChange={e => handleMonthChange(e.target.value)}
              style={{ background: 'var(--bg-input)', border: '1px solid var(--primary)', color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              {FY_MONTHS.map(m => (
                <option key={m.val} value={m.val} style={{ background: '#111' }}>{m.label}</option>
              ))}
            </select>
          </div>

          <FilterSelect label="Supplier" value={filterSupplier} options={uniqueSuppliers} onChange={setFilterSupplier} />
          <FilterSelect label="Commodity" value={filterCommodity} options={uniqueCommodities} onChange={setFilterCommodity} />
          <FilterSelect label="Item Code" value={filterItem} options={uniqueItems} onChange={setFilterItem} />
          <FilterSelect label="Risk Status" value={filterRisk} options={riskLevels} onChange={setFilterRisk} />

          {/* Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '600' }}>Search</span>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
                placeholder="Item code or name..."
                className="input-field"
                style={{ paddingLeft: '30px', width: '100%', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <button onClick={() => fetchPlanning(selectedMonth)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>📦</div>
          <div><p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Items Shown</p><h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{filteredData.length}</h4></div>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>⚠️</div>
          <div><p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>High Risk Items</p><h4 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--danger)' }}>{highRiskCount}</h4></div>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>💰</div>
          <div><p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Total Planning Value</p><h4 style={{ fontSize: '1.2rem', fontWeight: '700' }}>₹{totalPlanValue.toLocaleString()}</h4></div>
        </div>
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>📅</div>
          <div><p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Selected Month</p><h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{FY_MONTHS.find(m => m.val === selectedMonth)?.label}</h4></div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%', minWidth: '1400px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th>Item Details</th>
                <th>LY Consumption</th>
                <th>LY Schedule</th>
                <th>Current Stock</th>
                <th>SOB %</th>
                <th>Supplier / Price</th>
                <th>Lead Time</th>
                <th>Safety Stock</th>
                <th>Risk Factor</th>
                <th>Forecast Qty</th>
                <th>Net Req.</th>
                <th>Suggested Qty</th>
                <th>Plan Value ₹</th>
                <th>Risk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="15" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>
                  <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite' }} /><br />
                  Calculating planning for {FY_MONTHS.find(m => m.val === selectedMonth)?.label}...
                </td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="15" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>
                  No planning data for selected month. Upload your FY 25-26 schedule data to begin.
                </td></tr>
              ) : filteredData.map((item, i) => {
                const isEditing = editingRow === (item._id || item.itemCode);
                const alloc = item.allocations?.[0] || {};
                return (
                  <tr key={item._id || i}>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{item.itemCode}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{item.itemName}</div>
                      {item.commodity && <div style={{ fontSize: '0.6rem', color: 'var(--accent)' }}>{item.commodity}</div>}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{item.lyConsumption ?? item.forecastQty ?? 0}</td>
                    <td style={{ fontSize: '0.85rem' }}>{item.lyScheduleQty ?? 0}</td>
                    <td>
                      <EditableCell value={isEditing ? editValues.currentStock : item.currentStock} isEditing={isEditing} type="number" onChange={v => setEditValues({...editValues, currentStock: v})} />
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{alloc.percentage ?? 0}%</td>
                    <td>
                      <div style={{ fontSize: '0.8rem', fontWeight: '500' }}>{alloc.supplierCode || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>₹{alloc.rate ?? 0}</div>
                    </td>
                    <td>
                      <EditableCell value={isEditing ? editValues.leadTime ?? alloc.leadDays : (item.leadTime ?? alloc.leadDays ?? 0)} isEditing={isEditing} type="number" onChange={v => setEditValues({...editValues, leadTime: v})} />
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>d</span>
                    </td>
                    <td>
                      <EditableCell value={isEditing ? editValues.safetyStock : item.safetyStock} isEditing={isEditing} type="number" onChange={v => setEditValues({...editValues, safetyStock: v})} />
                    </td>
                    <td>
                      <EditableCell value={isEditing ? (editValues.riskFactor ?? 1) : (item.riskFactor ?? 1)} isEditing={isEditing} type="number" onChange={v => setEditValues({...editValues, riskFactor: v})} />
                    </td>
                    <td style={{ fontWeight: '600' }}>{item.forecastQty}</td>
                    <td style={{ fontWeight: '600' }}>{item.netRequirement}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '700' }}>{item.suggestedOrderQty}</td>
                    <td style={{ fontSize: '0.85rem' }}>₹{(alloc.value ?? 0).toLocaleString()}</td>
                    <td>
                      <RiskBadge level={item.risk} />
                      {item.currentStock < item.safetyStock && <div style={{ fontSize: '0.6rem', color: 'var(--danger)', marginTop: '2px' }}>Stockout!</div>}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={saveEdit} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Save size={16} /></button>
                          <button onClick={cancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(item)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Alert Cards ── */}
      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Stockout Alerts</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filteredData.filter(d => d.risk === 'High').length} items below safety stock for {FY_MONTHS.find(m => m.val === selectedMonth)?.label}.
          </p>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Info size={18} color="var(--warning)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Excess Inventory</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filteredData.filter(d => d.currentStock > (d.safetyStock || 0) * 5).length} items have stock exceeding 5x safety stock.
          </p>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Info size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>Planning Summary</h4>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Total {filteredData.length} items planned · ₹{totalPlanValue.toLocaleString()} estimated value
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default InventoryPlanning;
