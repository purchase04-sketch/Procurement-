import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, TrendingDown, Target, Zap } from 'lucide-react';

const CostSavings = () => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    axios.get(`http://localhost:5000/api/savings?month=${month}`)
      .then(res => {
        setSavings(res.data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Cost Savings</h2>
        <p style={{ color: 'var(--text-dim)' }}>Track negotiation, PPV, and alternate supplier savings</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <DollarSign color="var(--success)" />
            <span className="badge badge-success">+12% vs Target</span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '16px' }}>₹4,50,000</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Total Monthly Savings</p>
        </div>
        <div className="glass-card" style={{ padding: '24px' }}>
          <Target color="var(--primary)" />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '16px' }}>₹4,00,000</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Monthly Target</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: '0' }}>
          <thead>
            <tr>
              <th>Saving Type</th>
              <th>Item / Supplier</th>
              <th>Prev. Rate</th>
              <th>New Rate</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '100px' }}>Calculating savings...</td></tr>
            ) : savings.map((s, i) => (
              <tr key={i}>
                <td><span className="badge" style={{ background: 'var(--bg-input)' }}>{s.savingType}</span></td>
                <td>
                   <div style={{ fontWeight: '600' }}>{s.itemName}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.supplierName}</div>
                </td>
                <td>₹{s.previousRate}</td>
                <td style={{ color: 'var(--success)' }}>₹{s.newRate}</td>
                <td>{s.quantity}</td>
                <td style={{ fontWeight: '700' }}>₹{s.savingAmount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CostSavings;
