import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Clock, CheckCircle2, AlertCircle, Eye, Send } from 'lucide-react';

const MonthlySchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    axios.get(`http://localhost:5000/api/schedule?month=${month}`)
      .then(res => {
        setSchedules(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handlePreview = async (supplierCode) => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    try {
      const res = await axios.post('http://localhost:5000/api/schedule/mail-preview', { supplierCode, month });
      setPreviewHtml(res.data.html);
      setSelectedSupplier(supplierCode);
      setShowModal(true);
    } catch (err) {
      alert('Failed to generate preview: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSend = async () => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    try {
      await axios.post('http://localhost:5000/api/schedule/mail-send', { supplierCode: selectedSupplier, month });
      alert('Reminder sent successfully!');
      setShowModal(false);
    } catch (err) {
      alert('Failed to send mail: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Monthly Schedule Supply</h2>
          <p style={{ color: 'var(--text-dim)' }}>Track dispatch status and send automated supplier reminders</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%' }}>
            <thead>
              <tr>
                <th>Item / Supplier</th>
                <th>Planned Qty</th>
                <th>Required Date</th>
                <th>Schedule Qty</th>
                <th>Pending Qty</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>Loading schedule data...</td></tr>
              ) : schedules.map((s, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.itemCode} - {s.itemName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.supplierName} ({s.supplierCode})</div>
                  </td>
                  <td>{s.plannedQty}</td>
                  <td>{new Date(s.requiredDate).toLocaleDateString()}</td>
                  <td>{s.scheduleQty}</td>
                  <td style={{ color: s.pendingQty > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: '600' }}>{s.pendingQty}</td>
                  <td>
                    <span className={`badge ${s.dispatchStatus === 'Dispatched' ? 'badge-success' : 'badge-warning'}`}>
                      {s.dispatchStatus}
                    </span>
                  </td>
                  <td>
                    {s.pendingQty > 0 && (
                      <button 
                        className="btn-secondary" 
                        onClick={() => handlePreview(s.supplierCode)}
                        style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Mail size={14} /> Reminder
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && schedules.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '100px', color: 'var(--text-dim)' }}>No schedule found for this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ background: 'var(--bg-sidebar)', width: '100%', maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Email Preview</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: '#fff', color: '#333' }}>
               <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSend}>
                <Send size={16} /> Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlySchedule;
