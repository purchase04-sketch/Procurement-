import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle, History, Download } from 'lucide-react';

const DataSourceCard = ({ title, description, module, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
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
      setMsg(`${res.data.rows} rows processed`);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          <FileText size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{title}</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '12px' }}>{description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Excel / CSV'}
              <input type="file" hidden onChange={handleFileChange} accept=".xlsx,.xls,.csv" disabled={uploading} />
            </label>
            {status === 'success' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> {msg}
              </span>
            )}
            {status === 'error' && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {msg}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DataSources = () => {
  const [history, setHistory] = useState([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/history')
      .then(res => setHistory(res.data))
      .catch(() => {});
  }, [refresh]);

  const sources = [
    { 
      title: 'Inventory Planning Data (Single Sheet)', 
      module: 'inventoryplanning',
      description: 'Upload one Excel containing: Annual consumption, Stock, Share of Business, FY 25-26 schedule, Supplier prices, Supplier-item mapping, Lead time, Safety stock, Risk factor'
    },
    { 
      title: 'Supplier Master', 
      module: 'suppliers',
      description: 'Supplier codes, names, contact info, payment terms'
    },
    { 
      title: 'Cost Saving Data', 
      module: 'savingdata',
      description: 'Target vs actual savings, negotiation, alternate supplier data'
    },
    { 
      title: 'Supplier Performance Data', 
      module: 'performance',
      description: 'OTD %, delay days, quality rejection, compliance scores'
    },
    { 
      title: 'Monthly Schedule Supply', 
      module: 'schedule',
      description: 'Planned quantities, schedule dates, dispatch tracking'
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Data Sources</h2>
          <p style={{ color: 'var(--text-dim)' }}>Upload procurement data from Oracle ERP exports</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {sources.map(s => (
          <DataSourceCard 
            key={s.title} 
            title={s.title} 
            description={s.description}
            module={s.module} 
            onUploadSuccess={() => setRefresh(r => r + 1)} 
          />
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
                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>No upload history yet. Upload your first file above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataSources;
