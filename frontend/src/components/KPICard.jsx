import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ label, value, trend, trendDir = 'up', icon, color = 'blue' }) {
  const colorMap = {
    blue:   'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    green:  'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    amber:  'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    red:    'from-red-500/20 to-red-500/5 border-red-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
  };

  return (
    <div className={`glass-card p-5 bg-gradient-to-br ${colorMap[color] || colorMap.blue}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{value}</div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendDir === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendDir === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {trend}
        </div>
      )}
    </div>
  );
}
