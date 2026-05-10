import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Star, Activity, ShieldCheck } from 'lucide-react';

const SupplierPerformance = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/dashboard/supplier-performance')
      .then(res => {
        setSuppliers(res.data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Supplier Performance</h2>
        <p style={{ color: 'var(--text-dim)' }}>Comprehensive scorecard and quality compliance ranking</p>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: '0' }}>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>OTD %</th>
              <th>Quality Score</th>
              <th>Compliance</th>
              <th>Overall Score</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px' }}>Analyzing performance...</td></tr>
            ) : suppliers.map((s, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: '600' }}>{s.supplierName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.supplierCode}</div>
                </td>
                <td>{s.otdScore}%</td>
                <td>{s.qualityScore}/100</td>
                <td><span className="badge badge-success">Compliant</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, width: '80px', height: '6px', background: 'var(--bg-input)', borderRadius: '3px' }}>
                      <div style={{ width: `${s.performanceScore}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{s.performanceScore}</span>
                  </div>
                </td>
                <td><span className={`badge ${s.riskLevel === 'Low' ? 'badge-success' : 'badge-warning'}`}>{s.riskLevel}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierPerformance;
