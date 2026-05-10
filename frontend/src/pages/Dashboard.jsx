import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  CheckCircle2,
  Package,
  Activity
} from 'lucide-react';

const KPICard = ({ title, value, icon, color, trend }) => (
  <div className="glass-card" style={{ padding: '24px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {trend && (
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: trend.startsWith('+') ? 'var(--success)' : 'var(--danger)' }}>
          {trend}
        </span>
      )}
    </div>
    <div style={{ marginTop: '16px' }}>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: '500' }}>{title}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '4px' }}>{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = localStorage.getItem('activeMonth') || '2026-04';
    axios.get(`http://localhost:5000/api/dashboard/kpis?month=${month}`)
      .then(res => {
        setKpis(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    
    // Listen for month changes
    const handleStorage = () => {
      setLoading(true);
      const newMonth = localStorage.getItem('activeMonth');
      axios.get(`http://localhost:5000/api/dashboard/kpis?month=${newMonth}`).then(res => {
        setKpis(res.data);
        setLoading(false);
      });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const chartData = [
    { name: 'Apr', planning: 4000, actual: 2400 },
    { name: 'May', planning: 3000, actual: 1398 },
    { name: 'Jun', planning: 2000, actual: 9800 },
    { name: 'Jul', planning: 2780, actual: 3908 },
    { name: 'Aug', planning: 1890, actual: 4800 },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Procurement Overview</h2>
        <p style={{ color: 'var(--text-dim)' }}>Real-time inventory and supplier risk intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KPICard title="Total Items" value={kpis?.totalItems || 0} icon={<Package size={22} />} color="#3b82f6" />
        <KPICard title="Inventory Risk" value={kpis?.criticalItems || 0} icon={<AlertTriangle size={22} />} color="#ef4444" trend="High Risk" />
        <KPICard title="OTD Rate" value={`${kpis?.otdRate || 0}%`} icon={<CheckCircle2 size={22} />} color="#10b981" trend="+2.4%" />
        <KPICard title="Monthly Spend" value={`₹${(kpis?.monthlySpend || 0).toLocaleString()}`} icon={<DollarSign size={22} />} color="#8b5cf6" />
        <KPICard title="Monthly Savings" value={`₹${(kpis?.monthlySavings || 0).toLocaleString()}`} icon={<TrendingUp size={22} />} color="#f59e0b" />
        <KPICard title="Supplier Compliance" value={`${kpis?.complianceRate || 0}%`} icon={<Users size={22} />} color="#06b6d4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>Planning vs Consumption Trend</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="planning" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px' }}>Inventory Status</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Healthy', value: kpis?.totalItems - kpis?.criticalItems - kpis?.riskItems || 1 },
                    { name: 'Risk', value: kpis?.riskItems || 0 },
                    { name: 'Critical', value: kpis?.criticalItems || 0 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="var(--success)" />
                  <Cell fill="var(--warning)" />
                  <Cell fill="var(--danger)" />
                </Pie>
                <Tooltip 
                   contentStyle={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></div> Healthy</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--warning)', borderRadius: '50%' }}></div> Risk</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></div> Critical</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
