import React, { useState, useEffect } from 'react';
import { Search, Bell, RefreshCw, User } from 'lucide-react';
import axios from 'axios';

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

const BUYERS = ['All Buyers', 'Buyer A', 'Buyer B', 'Buyer C', 'Buyer D', 'Buyer E'];

const TopBar = ({ onRefresh }) => {
  const [selectedMonth, setSelectedMonth] = useState(localStorage.getItem('activeMonth') || '2026-04');
  const [selectedBuyer, setSelectedBuyer] = useState(localStorage.getItem('activeBuyer') || 'All Buyers');

  return (
    <header style={{ height: '70px', padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(10, 11, 16, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search items, suppliers..." 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '36px', background: 'var(--bg-input)', fontSize: '0.8rem' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Buyer Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={14} color="var(--text-dim)" />
          <select 
            value={selectedBuyer}
            onChange={(e) => {
              setSelectedBuyer(e.target.value);
              localStorage.setItem('activeBuyer', e.target.value);
              window.dispatchEvent(new Event('storage'));
            }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
          >
            {BUYERS.map(b => (
              <option key={b} value={b} style={{ background: '#111' }}>{b}</option>
            ))}
          </select>
        </div>

        {/* Month Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>Month:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              localStorage.setItem('activeMonth', e.target.value);
              window.dispatchEvent(new Event('storage'));
            }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', padding: '6px 10px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}
          >
            {FY_MONTHS.map(m => (
              <option key={m.val} value={m.val} style={{ background: '#111' }}>{m.label}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} />
        </button>

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={18} color="var(--text-muted)" />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '7px', height: '7px', background: 'var(--danger)', borderRadius: '50%' }}></div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
