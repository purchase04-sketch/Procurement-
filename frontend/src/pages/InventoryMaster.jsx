import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, RefreshCw, Layers } from 'lucide-react';

const InventoryMaster = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/inventory');
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setEditValues({ ...item });
  };

  const handleSave = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/inventory/${id}`, editValues);
      setEditingId(null);
      fetchData();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Inventory Master</h2>
          <p style={{ color: 'var(--text-dim)' }}>Manage base inventory data, categories, and stock levels</p>
        </div>
        <button className="btn-primary" onClick={fetchData}>
          <RefreshCw size={18} /> Sync with Oracle
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: '0' }}>
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Unit Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px' }}>Loading inventory...</td></tr>
            ) : items.map(item => (
              <tr key={item._id}>
                <td>{item.itemCode}</td>
                <td>{editingId === item._id ? <input className="input-field" value={editValues.itemName} onChange={e => setEditValues({...editValues, itemName: e.target.value})} style={{ padding: '4px 8px' }} /> : item.itemName}</td>
                <td><span className="badge" style={{ background: 'var(--bg-input)' }}>{item.category}</span></td>
                <td>{editingId === item._id ? <input type="number" className="input-field" value={editValues.currentStock} onChange={e => setEditValues({...editValues, currentStock: e.target.value})} style={{ padding: '4px 8px', width: '80px' }} /> : item.currentStock}</td>
                <td>₹{item.unitPrice}</td>
                <td>
                  <span className={`badge ${item.status === 'Healthy' ? 'badge-success' : item.status === 'Risk' ? 'badge-warning' : 'badge-danger'}`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {editingId === item._id ? (
                    <button onClick={() => handleSave(item._id)} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Save size={18} /></button>
                  ) : (
                    <button onClick={() => handleEdit(item)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryMaster;
