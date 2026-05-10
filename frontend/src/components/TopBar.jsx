import React, { useState, useEffect } from 'react';
import { Search, Bell, RefreshCw, ChevronDown } from 'lucide-react';
import axios from 'axios';

const TopBar = ({ onRefresh }) => {
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    // Fetch months from master
    axios.get('http://localhost:5000/api/planningmonth')
      .then(res => {
        if (res.data.length > 0) {
          setMonths(res.data);
          const active = res.data.find(m => m.active);
          setSelectedMonth(active ? active.val : res.data[0].val);
        } else {
          // Fallback static months if master is empty
          const fallback = [
            { label: 'Apr 2026', val: '2026-04' },
            { label: 'May 2026', val: '2026-05' },
            { label: 'Jun 2026', val: '2026-06' },
            { label: 'Jul 2026', val: '2026-07' },
            { label: 'Aug 2026', val: '2026-08' },
            { label: 'Sep 2026', val: '2026-09' },
            { label: 'Oct 2026', val: '2026-10' },
            { label: 'Nov 2026', val: '2026-11' },
            { label: 'Dec 2026', val: '2026-12' },
            { label: 'Jan 2027', val: '2027-01' },
            { label: 'Feb 2027', val: '2027-02' },
            { label: 'Mar 2027', val: '2027-03' },
          ];
          setMonths(fallback);
          setSelectedMonth('2026-04');
        }
      })
      .catch(() => {
         const fallback = [
          { label: 'Apr 2026', val: '2026-04' },
          { label: 'May 2026', val: '2026-05' },
          { label: 'Jun 2026', val: '2026-06' },
        ];
        setMonths(fallback);
        setSelectedMonth('2026-04');
      });
  }, []);

  return (
    <header style={{ height: '70px', padding: '0 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'rgba(10, 11, 16, 0.8)', backdropFilter: 'blur(10px)', sticky: 'top', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <div style={{ position: 'relative', width: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input 
            type="text" 
            placeholder="Search items, suppliers, reports..." 
            className="input-field" 
            style={{ width: '100%', paddingLeft: '40px', background: 'var(--bg-input)' }} 
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>Planning Month:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              localStorage.setItem('activeMonth', e.target.value);
              window.dispatchEvent(new Event('storage')); // Trigger update across tabs/components
            }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: '#fff', borderRadius: 'var(--radius-md)', padding: '6px 12px', outline: 'none', cursor: 'pointer' }}
          >
            {months.map(m => (
              <option key={m.val} value={m.val} style={{ background: '#111' }}>{m.label || m.month}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={onRefresh}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={18} />
          <span style={{ fontSize: '0.8rem' }}>Refresh Data</span>
        </button>

        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={20} color="var(--text-muted)" />
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-main)' }}></div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
