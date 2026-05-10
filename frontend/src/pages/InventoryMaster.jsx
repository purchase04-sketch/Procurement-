import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Search, Save, RefreshCw, Plus, Trash2, Edit3, X, Download, Upload } from 'lucide-react';

const InventoryMaster = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const buyer = localStorage.getItem('activeBuyer') || 'All Buyers';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await axios.get('http://localhost:5000/api/inventory'); setItems(res.data); }
    catch { setItems([]); }
    setLoading(false);
  };

  const filteredItems = buyer === 'All Buyers' ? items : items.filter(i => i.buyer === buyer);

  const handleAdd = () => {
    const newRow = { _tempId: Date.now(), itemCode: '', itemName: '', category: 'General', currentStock: 0, safetyStock: 0, unitPrice: 0, buyer: buyer === 'All Buyers' ? 'Buyer A' : buyer, status: 'Healthy' };
    setItems([newRow, ...items]);
    setEditingId(newRow._tempId);
    setEditValues(newRow);
  };

  const handleDelete = async (row) => {
    if (!confirm('Delete this item?')) return;
    if (row._id) { try { await axios.delete(`http://localhost:5000/api/inventory/${row._id}`); } catch {} }
    setItems(items.filter(i => (i._id || i._tempId) !== (row._id || row._tempId)));
  };

  const handleSave = async () => {
    try {
      if (editValues._id) { await axios.put(`http://localhost:5000/api/inventory/${editValues._id}`, editValues); }
      else { await axios.post('http://localhost:5000/api/inventory', editValues); }
      setEditingId(null); fetchData();
    } catch {
      setItems(items.map(i => (i._id || i._tempId) === (editValues._id || editValues._tempId) ? editValues : i));
      setEditingId(null);
    }
  };

  const handleDownload = () => {
    const rows = filteredItems.map(i => ({ 'Item Code': i.itemCode, 'Item Name': i.itemName, 'Category': i.category, 'Current Stock': i.currentStock, 'Safety Stock': i.safetyStock, 'Unit Price': i.unitPrice, 'Buyer': i.buyer, 'Status': i.status }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory Master');
    XLSX.writeFile(wb, 'Inventory_Master.xlsx');
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const formData = new FormData(); formData.append('file', file);
    try { await axios.post('http://localhost:5000/api/upload/inventory', formData); fetchData(); alert('Upload successful!'); }
    catch (err) { alert('Upload failed: ' + (err.response?.data?.error || err.message)); }
    e.target.value = '';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Inventory Master</h2>
          <p style={{ color: 'var(--text-dim)' }}>Manage base inventory data, categories, and stock levels {buyer !== 'All Buyers' && `· ${buyer}`}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleAdd}><Plus size={16} /> Add</button>
          <label className="btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Upload size={16} /> Upload
            <input type="file" hidden onChange={handleUpload} accept=".xlsx,.xls,.csv" />
          </label>
          <button className="btn-primary" onClick={handleDownload}><Download size={16} /> Download</button>
          <button onClick={fetchData} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%' }}>
            <thead><tr><th>Item Code</th><th>Item Name</th><th>Category</th><th>Stock</th><th>Safety Stock</th><th>Unit Price</th><th>Buyer</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>Loading...</td></tr>
              : filteredItems.length === 0 ? <tr><td colSpan="9" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>No inventory data. Click Add or Upload.</td></tr>
              : filteredItems.map((item, i) => {
                const id = item._id || item._tempId;
                const isEd = editingId === id;
                return (
                  <tr key={id || i}>
                    <td>{isEd ? <input className="input-field" style={{ padding: '4px 8px', width: '90px', fontSize: '0.8rem' }} value={editValues.itemCode} onChange={e => setEditValues({...editValues, itemCode: e.target.value})} /> : item.itemCode}</td>
                    <td>{isEd ? <input className="input-field" style={{ padding: '4px 8px', width: '120px', fontSize: '0.8rem' }} value={editValues.itemName} onChange={e => setEditValues({...editValues, itemName: e.target.value})} /> : item.itemName}</td>
                    <td>{isEd ? <input className="input-field" style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem' }} value={editValues.category} onChange={e => setEditValues({...editValues, category: e.target.value})} /> : <span className="badge" style={{ background: 'var(--bg-input)' }}>{item.category}</span>}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.currentStock} onChange={e => setEditValues({...editValues, currentStock: Number(e.target.value)})} /> : item.currentStock}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.safetyStock} onChange={e => setEditValues({...editValues, safetyStock: Number(e.target.value)})} /> : item.safetyStock}</td>
                    <td>{isEd ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.unitPrice} onChange={e => setEditValues({...editValues, unitPrice: Number(e.target.value)})} /> : `₹${item.unitPrice}`}</td>
                    <td>{isEd ? <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={editValues.buyer} onChange={e => setEditValues({...editValues, buyer: e.target.value})}><option>Buyer A</option><option>Buyer B</option><option>Buyer C</option><option>Buyer D</option><option>Buyer E</option></select> : (item.buyer || '—')}</td>
                    <td><span className={`badge ${item.status === 'Healthy' ? 'badge-success' : item.status === 'Risk' ? 'badge-warning' : 'badge-danger'}`}>{item.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isEd ? (<><button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Save size={16} /></button><button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={16} /></button></>) : (<><button onClick={() => { setEditingId(id); setEditValues({...item}); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit3 size={16} /></button><button onClick={() => handleDelete(item)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button></>)}
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

export default InventoryMaster;
