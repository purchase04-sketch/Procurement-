import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Mail, Download, Plus, Trash2, Edit3, Save, X, Upload, Send } from 'lucide-react';

const MonthlySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const month = localStorage.getItem('activeMonth') || '2026-04';
  const buyer = localStorage.getItem('activeBuyer') || 'All Buyers';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await axios.get(`http://localhost:5000/api/schedule?month=${month}`); setSchedules(res.data); }
    catch { setSchedules([]); }
    setLoading(false);
  };

  const filteredData = buyer === 'All Buyers' ? schedules : schedules.filter(s => s.buyer === buyer);

  const handleAdd = () => {
    const n = { _tempId: Date.now(), itemCode: '', itemName: '', supplierCode: '', supplierName: '', plannedQty: 0, scheduleQty: 0, pendingQty: 0, requiredDate: new Date().toISOString().slice(0, 10), dispatchStatus: 'Pending', buyer: buyer === 'All Buyers' ? 'Buyer A' : buyer, month };
    setSchedules([n, ...schedules]); setEditingId(n._tempId); setEditValues(n);
  };

  const handleDelete = async (row) => {
    if (!confirm('Delete?')) return;
    if (row._id) try { await axios.delete(`http://localhost:5000/api/schedule/${row._id}`); } catch {}
    setSchedules(schedules.filter(s => (s._id || s._tempId) !== (row._id || row._tempId)));
  };

  const handleSave = async () => {
    const data = { ...editValues, pendingQty: Math.max(0, (editValues.plannedQty || 0) - (editValues.scheduleQty || 0)) };
    try {
      if (editValues._id) await axios.put(`http://localhost:5000/api/schedule/${editValues._id}`, data);
      else await axios.post('http://localhost:5000/api/schedule', data);
      setEditingId(null); fetchData();
    } catch {
      setSchedules(schedules.map(s => (s._id || s._tempId) === (editValues._id || editValues._tempId) ? data : s));
      setEditingId(null);
    }
  };

  const handleDownload = () => {
    const rows = filteredData.map(s => ({ 'Item Code': s.itemCode, 'Item Name': s.itemName, 'Supplier Code': s.supplierCode, 'Planned Qty': s.plannedQty, 'Required Date': s.requiredDate, 'Schedule Qty': s.scheduleQty, 'Pending Qty': s.pendingQty, 'Status': s.dispatchStatus, 'Buyer': s.buyer, 'Month': s.month }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Schedule');
    XLSX.writeFile(wb, `Monthly_Schedule_${month}.xlsx`);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { await axios.post('http://localhost:5000/api/upload/schedule', formData); fetchData(); alert('Uploaded!'); }
    catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    e.target.value = '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Monthly Schedule Supply</h2>
          <p style={{ color: 'var(--text-dim)' }}>Track dispatch status and supplier schedules {buyer !== 'All Buyers' && `· ${buyer}`}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleAdd}><Plus size={16} /> Add</button>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={16} /> Upload<input type="file" hidden onChange={handleUpload} accept=".xlsx,.xls,.csv" /></label>
          <button className="btn-primary" onClick={handleDownload}><Download size={16} /> Download</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%' }}>
            <thead><tr><th>Item / Supplier</th><th>Planned</th><th>Req. Date</th><th>Scheduled</th><th>Pending</th><th>Buyer</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>Loading...</td></tr>
              : filteredData.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>No schedule data. Click Add or Upload.</td></tr>
              : filteredData.map((s, i) => {
                const id = s._id || s._tempId;
                const isEd = editingId === id;
                const pending = Math.max(0, (s.plannedQty || 0) - (s.scheduleQty || 0));
                return (
                  <tr key={id || i}>
                    <td>{isEd ? <><input className="input-field" style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem', marginBottom: '2px' }} value={editValues.itemCode} onChange={e => setEditValues({...editValues, itemCode: e.target.value})} /><br/><input className="input-field" style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem' }} value={editValues.supplierCode} onChange={e => setEditValues({...editValues, supplierCode: e.target.value})} /></> : <><div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.itemCode}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.supplierName || s.supplierCode}</div></>}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '60px', fontSize: '0.8rem' }} value={editValues.plannedQty} onChange={e => setEditValues({...editValues, plannedQty: Number(e.target.value)})} /> : s.plannedQty}</td>
                    <td>{isEd ? <input type="date" className="input-field" style={{ padding: '4px 8px', fontSize: '0.8rem' }} value={editValues.requiredDate?.slice(0,10)} onChange={e => setEditValues({...editValues, requiredDate: e.target.value})} /> : new Date(s.requiredDate).toLocaleDateString()}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '60px', fontSize: '0.8rem' }} value={editValues.scheduleQty} onChange={e => setEditValues({...editValues, scheduleQty: Number(e.target.value)})} /> : s.scheduleQty}</td>
                    <td style={{ color: pending > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>{pending}</td>
                    <td>{isEd ? <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={editValues.buyer} onChange={e => setEditValues({...editValues, buyer: e.target.value})}><option>Buyer A</option><option>Buyer B</option><option>Buyer C</option><option>Buyer D</option><option>Buyer E</option></select> : (s.buyer || '—')}</td>
                    <td>{isEd ? <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={editValues.dispatchStatus} onChange={e => setEditValues({...editValues, dispatchStatus: e.target.value})}><option>Pending</option><option>Dispatched</option><option>Delayed</option></select> : <span className={`badge ${s.dispatchStatus === 'Dispatched' ? 'badge-success' : s.dispatchStatus === 'Delayed' ? 'badge-danger' : 'badge-warning'}`}>{s.dispatchStatus}</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isEd ? (<><button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Save size={16} /></button><button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={16} /></button></>) : (<><button onClick={() => { setEditingId(id); setEditValues({...s}); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit3 size={16} /></button><button onClick={() => handleDelete(s)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button></>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlySchedule;
