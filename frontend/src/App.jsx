import { useState, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import SavingsPage from './pages/SavingsPage';
import SuppliersPage from './pages/SuppliersPage';
import DataHubPage from './pages/DataHubPage';
import OrdersPage from './pages/OrdersPage';
import ToastContainer from './components/ToastContainer';

export const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
    addToast('System data refreshed successfully', 'success');
  };

  const views = {
    dashboard:  <Dashboard />,
    inventory:  <InventoryPage />,
    savings:    <SavingsPage />,
    suppliers:  <SuppliersPage />,
    orders:     <OrdersPage />,
    datahub:    <DataHubPage />,
  };

  return (
    <AppContext.Provider value={{ selectedMonth, setSelectedMonth, refreshKey, triggerRefresh, addToast, currentView, setCurrentView }}>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar active={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          <TopBar />
          <div className="flex-1 overflow-y-auto p-6 animate-fade-up" key={`${currentView}-${refreshKey}`}>
            {views[currentView] || <Dashboard />}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </AppContext.Provider>
  );
}
