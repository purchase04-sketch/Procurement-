import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, History, ChevronRight } from 'lucide-react';

const DataSourceCard = ({ title, module, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [msg, setMsg] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setStatus(null);

    try {
      const res = await axios.post(`http://localhost:5000/api/upload/${module}`, formData);
      setStatus('success');
      setMsg(`${res.data.inserted} inserted, ${res.data.updated} updated`);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: var(--primary) }}>
        <FileText size={24} />
      </div>
      
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {uploading ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Uploading...</span>
          ) : status === 'success' ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={12} /> {msg}
            </span>
          ) : status === 'error' ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={12} /> {msg}
            </span>
          ) : (
             <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No file uploaded yet</span>
          )}
        </div>
      </div>

      <label className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Upload size={14} />
        Browse
        <input type="file" hidden onChange={handleFileChange} accept=".xlsx,.xls,.csv" />
      </label>
    </div>
  );
};

const DataSources = () => {
  const [history, setHistory] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/history')
      .then(res => setHistory(res.data))
      .catch(err => console.error(err));
  }, [refresh]);

  const sources = [
    { title: 'Item Master', module: 'inventory' },
    { title: 'Supplier Master', module: 'suppliers' },
    { title: 'Commodity Master', module: 'commodity' },
    { title: 'Monthly Consumption FY 25-26', module: 'consumption' },
    { title: 'Stock Data', module: 'inventory' }, // Overlaps with inventory
    { title: 'Supplier Prices', module: 'prices' },
    { title: 'Share of Business', module: 'sob' },
    { title: 'Lead Days', module: 'leaddays' },
    { title: 'Safety Stock', module: 'safetystock' },
    { title: 'Cost Saving Data', module: 'savingdata' },
    { title: 'Supplier Performance Data', module: 'performance' },
    { title: 'Monthly Schedule Supply', module: 'schedule' },
    { title: 'Planning Month Master', module: 'planningmonth' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Data Sources</h2>
          <p style={{ color: 'var(--text-dim)' }}>Upload and link procurement data from Oracle ERP exports</p>
        </div>
        <button className="btn-primary">
          <Download size={18} /> Download All Templates
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {sources.map(s => (
          <DataSourceCard key={s.title} title={s.title} module={s.module} onUploadSuccess={() => setRefresh(r => r + 1)} />
        ))}
      </div>

      <div className="glass-card" style={{ padding: '25px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <History size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Upload History</h3>
        </div>
        
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Module</th>
              <th>File Name</th>
              <th>Uploaded By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{new Date(h.date).toLocaleString()}</td>
                <td><span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>{h.moduleName}</span></td>
                <td>{h.fileName}</td>
                <td>{h.uploadedBy}</td>
                <td><span className="badge badge-success">Completed</span></td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>No upload history found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataSources;
