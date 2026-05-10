import { RefreshCw, Search } from 'lucide-react';
import { useAppContext } from '../App';

export default function TopBar() {
  const { selectedMonth, setSelectedMonth, triggerRefresh } = useAppContext();

  const months = [];
  const now = new Date();
  for (let i = -3; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    months.push({ val, label: i === 0 ? `${label} (Current)` : i > 0 ? `${label} (Projection)` : label });
  }

  return (
    <header className="h-[68px] min-h-[68px] flex items-center justify-between px-6 border-b border-white/[0.07] bg-[#060810]/80 backdrop-blur-md sticky top-0 z-20">
      {/* Search */}
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5 w-[380px]">
        <Search size={16} className="text-gray-500" />
        <input
          type="text"
          placeholder="Search items, suppliers, orders..."
          className="bg-transparent border-none outline-none text-sm text-gray-200 w-full placeholder:text-gray-600"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Planning Month:</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] text-gray-200 text-sm px-3 py-1.5 rounded-lg outline-none cursor-pointer"
          >
            {months.map(m => (
              <option key={m.val} value={m.val} className="bg-gray-900">{m.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={triggerRefresh}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>
    </header>
  );
}
