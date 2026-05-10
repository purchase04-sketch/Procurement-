import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Award, Download, Plus, Trash2, Edit3, Save, X, Upload } from 'lucide-react';

const SupplierPerformance = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const buyer = localStorage.getItem('activeBuyer') || 'All Buyers';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await axios.get('http://localhost:5000/api/dashboard/supplier-performance'); setSuppliers(res.data); }
    catch { setSuppliers([]); }
    setLoading(false);
  };

  const filteredData = buyer === 'All Buyers' ? suppliers : suppliers.filter(s => s.buyer === buyer);

  const handleAdd = () => {
    const n = { _tempId: Date.now(), supplierCode: '', supplierName: '', otdScore: 0, qualityScore: 0, complianceScore: 0, riskLevel: 'Low', buyer: buyer === 'All Buyers' ? 'Buyer A' : buyer };
    setSuppliers([n, ...suppliers]); setEditingId(n._tempId); setEditValues(n);
  };

  const handleDelete = async (row) => {
    if (!confirm('Delete?')) return;
    if (row._id) try { await axios.delete(`http://localhost:5000/api/suppliers/${row._id}`); } catch {}
    setSuppliers(suppliers.filter(s => (s._id || s._tempId) !== (row._id || row._tempId)));
  };

  const handleSave = async () => {
    const score = Math.round(((editValues.otdScore || 0) + (editValues.qualityScore || 0) + (editValues.complianceScore || 0)) / 3);
    const data = { ...editValues, performanceScore: score };
    try {
      if (editValues._id) await axios.put(`http://localhost:5000/api/suppliers/${editValues._id}`, data);
      else await axios.post('http://localhost:5000/api/suppliers', data);
      setEditingId(null); fetchData();
    } catch {
      setSuppliers(suppliers.map(s => (s._id || s._tempId) === (editValues._id || editValues._tempId) ? data : s));
      setEditingId(null);
    }
  };

  const handleDownload = () => {
    const rows = filteredData.map(s => ({ 'Supplier Code': s.supplierCode, 'Supplier Name': s.supplierName, 'OTD %': s.otdScore, 'Quality Score': s.qualityScore, 'Compliance': s.complianceScore, 'Overall': s.performanceScore, 'Risk': s.riskLevel, 'Buyer': s.buyer }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Supplier Performance');
    XLSX.writeFile(wb, 'Supplier_Performance.xlsx');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { await axios.post('http://localhost:5000/api/upload/suppliers', formData); fetchData(); alert('Uploaded!'); }
    catch (err) { alert('Failed: ' + (err.response?.data?.error || err.message)); }
    e.target.value = '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Supplier Performance</h2>
          <p style={{ color: 'var(--text-dim)' }}>Scorecard and quality compliance ranking {buyer !== 'All Buyers' && `· ${buyer}`}</p>
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
            <thead><tr><th>Supplier</th><th>OTD %</th><th>Quality</th><th>Compliance</th><th>Overall</th><th>Buyer</th><th>Risk</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>Loading...</td></tr>
              : filteredData.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>No data. Click Add or Upload.</td></tr>
              : filteredData.map((s, i) => {
                const id = s._id || s._tempId;
                const isEd = editingId === id;
                const score = Math.round(((s.otdScore || 0) + (s.qualityScore || 0) + (s.complianceScore || 0)) / 3);
                return (
                  <tr key={id || i}>
                    <td>{isEd ? <><input className="input-field" style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem', marginBottom: '2px' }} value={editValues.supplierCode} onChange={e => setEditValues({...editValues, supplierCode: e.target.value})} /><br/><input className="input-field" style={{ padding: '4px 8px', width: '120px', fontSize: '0.8rem' }} value={editValues.supplierName} onChange={e => setEditValues({...editValues, supplierName: e.target.value})} /></> : <><div style={{ fontWeight: '600' }}>{s.supplierName}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.supplierCode}</div></>}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '60px', fontSize: '0.8rem' }} value={editValues.otdScore} onChange={e => setEditValues({...editValues, otdScore: Number(e.target.value)})} /> : `${s.otdScore}%`}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '60px', fontSize: '0.8rem' }} value={editValues.qualityScore} onChange={e => setEditValues({...editValues, qualityScore: Number(e.target.value)})} /> : `${s.qualityScore}/100`}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '60px', fontSize: '0.8rem' }} value={editValues.complianceScore} onChange={e => setEditValues({...editValues, complianceScore: Number(e.target.value)})} /> : `${s.complianceScore}/100`}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: 'var(--bg-input)', borderRadius: '3px' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{score}</span>
                      </div>
                    </td>
                    <td>{isEd ? <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={editValues.buyer} onChange={e => setEditValues({...editValues, buyer: e.target.value})}><option>Buyer A</option><option>Buyer B</option><option>Buyer C</option><option>Buyer D</option><option>Buyer E</option></select> : (s.buyer || '—')}</td>
                    <td><span className={`badge ${s.riskLevel === 'Low' ? 'badge-success' : s.riskLevel === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>{s.riskLevel}</span></td>
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

export default SupplierPerformance;
