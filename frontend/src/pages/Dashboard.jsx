import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, DollarSign, Users, CheckCircle2, Package, Activity, ShoppingCart
} from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const KPICard = ({ title, value, icon, color, trend, subtitle }) => (
  <div className="glass-card" style={{ padding: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      {trend && <span style={{ fontSize: '0.7rem', fontWeight: '600', color: trend.startsWith('+') ? 'var(--success)' : trend === 'High Risk' ? 'var(--danger)' : 'var(--text-dim)' }}>{trend}</span>}
    </div>
    <div style={{ marginTop: '14px' }}>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: '500' }}>{title}</p>
      <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginTop: '2px' }}>{value}</h3>
      {subtitle && <p style={{ color: 'var(--text-dim)', fontSize: '0.65rem', marginTop: '2px' }}>{subtitle}</p>}
    </div>
  </div>
);

const Dashboard = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyer, setBuyer] = useState(localStorage.getItem('activeBuyer') || 'All Buyers');
  const [month, setMonth] = useState(localStorage.getItem('activeMonth') || '2026-04');

  useEffect(() => {
    fetchKPIs();
    const handleStorage = () => {
      setBuyer(localStorage.getItem('activeBuyer') || 'All Buyers');
      setMonth(localStorage.getItem('activeMonth') || '2026-04');
      fetchKPIs();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchKPIs = async () => {
    setLoading(true);
    const m = localStorage.getItem('activeMonth') || '2026-04';
    try {
      const res = await axios.get(`http://localhost:5000/api/dashboard/kpis?month=${m}`);
      setKpis(res.data);
    } catch { setKpis(null); }
    setLoading(false);
  };

  /* Sample data for charts — in production these come from API */
  const monthlyTrend = [
    { name: 'Apr', planned: 4200, actual: 3800, saving: 450 },
    { name: 'May', planned: 3800, actual: 3500, saving: 520 },
    { name: 'Jun', planned: 5100, actual: 4800, saving: 380 },
    { name: 'Jul', planned: 4600, actual: 4200, saving: 610 },
    { name: 'Aug', planned: 3900, actual: 3600, saving: 490 },
    { name: 'Sep', planned: 4400, actual: 4100, saving: 560 },
  ];

  const riskPie = [
    { name: 'Healthy', value: kpis ? Math.max(1, (kpis.totalItems || 0) - (kpis.criticalItems || 0) - (kpis.riskItems || 0)) : 1 },
    { name: 'Risk', value: kpis?.riskItems || 0 },
    { name: 'Critical', value: kpis?.criticalItems || 0 },
  ];

  const buyerPerformance = [
    { buyer: 'Buyer A', savings: 120000, items: 45, otd: 92 },
    { buyer: 'Buyer B', savings: 85000, items: 32, otd: 88 },
    { buyer: 'Buyer C', savings: 95000, items: 28, otd: 95 },
    { buyer: 'Buyer D', savings: 60000, items: 20, otd: 90 },
    { buyer: 'Buyer E', savings: 45000, items: 15, otd: 85 },
  ];

  const displayBuyerData = buyer === 'All Buyers' ? buyerPerformance : buyerPerformance.filter(b => b.buyer === buyer);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-dim)' }}>Loading Dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Procurement Overview</h2>
        <p style={{ color: 'var(--text-dim)' }}>
          Real-time inventory and supplier intelligence
          {buyer !== 'All Buyers' && <span style={{ color: 'var(--primary)', fontWeight: '600' }}> · {buyer}</span>}
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Total Items" value={kpis?.totalItems || 0} icon={<Package size={20} />} color="#3b82f6" />
        <KPICard title="Inventory Risk" value={kpis?.criticalItems || 0} icon={<AlertTriangle size={20} />} color="#ef4444" trend="High Risk" />
        <KPICard title="OTD Rate" value={`${kpis?.otdRate || 0}%`} icon={<CheckCircle2 size={20} />} color="#10b981" trend="+2.4%" />
        <KPICard title="Monthly Spend" value={`₹${(kpis?.monthlySpend || 0).toLocaleString()}`} icon={<DollarSign size={20} />} color="#8b5cf6" />
        <KPICard title="Monthly Savings" value={`₹${(kpis?.monthlySavings || 0).toLocaleString()}`} icon={<TrendingUp size={20} />} color="#f59e0b" />
        <KPICard title="Compliance" value={`${kpis?.complianceRate || 0}%`} icon={<Users size={20} />} color="#06b6d4" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Planning vs Consumption Trend</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a1b23', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="planned" stroke="#3b82f6" fill="rgba(59,130,246,0.1)" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" stroke="#8b5cf6" fill="rgba(139,92,246,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Inventory Status</h3>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPie} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                  <Cell fill="var(--success)" /><Cell fill="var(--warning)" /><Cell fill="var(--danger)" />
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1b23', border: '1px solid var(--border)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></div> Healthy</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--warning)', borderRadius: '50%' }}></div> Risk</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--danger)', borderRadius: '50%' }}></div> Critical</div>
          </div>
        </div>
      </div>

      {/* Buyer-wise Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>
            Buyer-wise Savings
            {buyer !== 'All Buyers' && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '8px' }}>Filtered: {buyer}</span>}
          </h3>
          <div style={{ height: '250px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayBuyerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="buyer" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1a1b23', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="savings" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Buyer Scorecard</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {displayBuyerData.map((b, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-input)' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{b.buyer}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{b.items} items managed</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '600', color: 'var(--success)', fontSize: '0.85rem' }}>₹{b.savings.toLocaleString()}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>OTD: {b.otd}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
