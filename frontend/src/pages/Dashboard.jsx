import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import KPICard from '../components/KPICard';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertTriangle, Clock, CheckCircle, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const { selectedMonth, refreshKey } = useAppContext();
  const [kpis, setKpis] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [kpiRes, supRes, ordRes, actRes] = await Promise.all([
          API.get(`/dashboard/kpis?month=${selectedMonth}`),
          API.get('/dashboard/supplier-performance'),
          API.get(`/orders?month=${selectedMonth}`),
          API.get('/activities'),
        ]);
        setKpis(kpiRes.data);
        setSuppliers(supRes.data);
        setOrders(ordRes.data);
        setActivities(actRes.data);
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
      setLoading(false);
    };
    load();
  }, [selectedMonth, refreshKey]);

  if (loading) return <LoadingSkeleton />;

  const otdChartData = suppliers.map(s => ({ name: s.supplierName?.substring(0, 12) || 'N/A', otd: s.otdScore || 0, quality: s.qualityScore || 0 }));
  const statusData = [
    { name: 'Completed', value: kpis?.completedOrders || 0, color: '#10b981' },
    { name: 'Delayed', value: kpis?.delayedOrders || 0, color: '#ef4444' },
    { name: 'Open', value: kpis?.openOrders || 0, color: '#3b82f6' },
    { name: 'Pending', value: kpis?.pendingApprovals || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const riskItems = orders.filter(o => o.status === 'Delayed' || o.isEmergency);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Executive Procurement Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time KPIs and supply chain health for {selectedMonth}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <KPICard label="OTD Rate" value={`${kpis?.otdRate || 0}%`} trend="vs last month" trendDir="up" icon="📦" color="green" />
        <KPICard label="Monthly Savings" value={`₹${((kpis?.monthlySavings || 0) / 1000).toFixed(0)}K`} trend={`YTD: ₹${((kpis?.yearlySavings || 0) / 100000).toFixed(1)}L`} trendDir="up" icon="💰" color="blue" />
        <KPICard label="Open Orders" value={kpis?.openOrders || 0} trend={`${kpis?.pendingApprovals || 0} pending approval`} trendDir="down" icon="📋" color="amber" />
        <KPICard label="Critical Items" value={kpis?.criticalItems || 0} trend={`${kpis?.riskItems || 0} at risk`} trendDir={kpis?.criticalItems > 0 ? 'down' : 'up'} icon="🚨" color="red" />
        <KPICard label="Emergency POs" value={kpis?.emergencyOrders || 0} trend="Active" trendDir="down" icon="⚡" color="purple" />
        <KPICard label="Compliance" value={`${kpis?.complianceRate || 0}%`} trend="Supplier avg" trendDir="up" icon="✅" color="green" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Supplier OTD */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Supplier OTD & Quality Scores</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={otdChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="otd" fill="#10b981" radius={[4, 4, 0, 0]} name="OTD %" />
              <Bar dataKey="quality" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Quality %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* PO Status Pie */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Order Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">No order data for this month. Upload PO data from Data Sources.</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Alerts + Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Critical Alerts */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Critical Procurement Alerts</h3>
            <span className="badge badge-danger">{riskItems.length} Active</span>
          </div>
          {riskItems.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>PO #</th><th>Item</th><th>Status</th><th>Delay</th></tr></thead>
              <tbody>
                {riskItems.slice(0, 8).map(o => (
                  <tr key={o._id}>
                    <td className="font-medium">{o.poNumber}</td>
                    <td>{o.itemName || o.itemCode}</td>
                    <td><span className={`badge ${o.status === 'Delayed' ? 'badge-danger' : 'badge-warning'}`}>{o.status}</span></td>
                    <td>{o.delayDays > 0 ? `${o.delayDays} days` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-600 text-sm">✅ No critical alerts. All systems healthy.</div>
          )}
        </div>

        {/* Activities */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300">Miscellaneous Activities</h3>
            <span className="text-xs text-gray-500">{activities.length} tracked</span>
          </div>
          {activities.length > 0 ? (
            <div className="px-5 pb-5 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {activities.slice(0, 10).map(a => (
                <div key={a._id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-200">{a.title}</div>
                    {a.assignedTo && <div className="text-xs text-gray-500 mt-0.5">{a.assignedTo}</div>}
                  </div>
                  <span className={`badge ${a.status === 'Completed' ? 'badge-success' : a.status === 'In Progress' ? 'badge-info' : 'badge-warning'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600 text-sm">No activities tracked. Add via Data Sources.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-white/[0.05] rounded w-80 mb-6" />
      <div className="grid grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white/[0.03] rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-80 bg-white/[0.03] rounded-2xl" />
        <div className="h-80 bg-white/[0.03] rounded-2xl" />
      </div>
    </div>
  );
}
