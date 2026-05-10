import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Database, 
  Box, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Calendar, 
  Download,
  Package
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Data Sources', icon: <Database size={20} />, path: '/data-sources' },
    { name: 'Inventory Master', icon: <Package size={20} />, path: '/inventory-master' },
    { name: 'Inventory Planning', icon: <Box size={20} />, path: '/inventory-planning' },
    { name: 'Cost Savings', icon: <DollarSign size={20} />, path: '/cost-savings' },
    { name: 'Supplier Performance', icon: <Award size={20} />, path: '/supplier-performance' },
    { name: 'Monthly Schedule', icon: <Calendar size={20} />, path: '/monthly-schedule' },
    { name: 'Reports', icon: <Download size={20} />, path: '/reports' },
  ];

  return (
    <aside style={{ width: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '30px 24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #fff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ANTIGRAVITY
        </h1>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Procurement System
        </p>
      </div>

      <nav style={{ flex: 1, padding: '10px 16px' }}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              marginBottom: '4px',
              transition: 'all 0.2s',
              border: isActive ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
            })}
          >
            <span style={{ display: 'flex' }}>{item.icon}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.8rem' }}>
            AD
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>Admin User</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Procurement Dept.</div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
