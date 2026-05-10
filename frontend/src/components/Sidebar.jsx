import { LayoutDashboard, Package, DollarSign, Truck, Database, ShoppingCart } from 'lucide-react';

const navItems = [
  { key: 'dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { key: 'inventory',  label: 'Inventory Planning',  icon: Package },
  { key: 'orders',     label: 'Purchase Orders',     icon: ShoppingCart },
  { key: 'savings',    label: 'Cost Savings',        icon: DollarSign },
  { key: 'suppliers',  label: 'Supplier Performance', icon: Truck },
  { key: 'datahub',    label: 'Data Sources',        icon: Database },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="w-[260px] min-w-[260px] h-full flex flex-col border-r border-white/[0.07] bg-[#0c0e16]">
      {/* Logo */}
      <div className="px-6 py-6 mb-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent" style={{ fontFamily: 'Outfit' }}>
            ProcureSmart AI
          </span>
        </div>
        <p className="text-[0.65rem] text-gray-500 mt-1 ml-10">Enterprise Procurement Hub</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer text-left
                ${isActive
                  ? 'bg-blue-500/15 text-blue-400 shadow-lg shadow-blue-500/5'
                  : 'text-gray-400 hover:bg-white/[0.04] hover:text-gray-200'
                }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-5 border-t border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">SA</div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-200">Solution Architect</span>
            <span className="text-[0.65rem] text-gray-500">Enterprise Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
