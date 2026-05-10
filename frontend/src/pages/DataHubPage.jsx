import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import ExcelUploader from '../components/ExcelUploader';
import { Plus, Trash2, Save, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const DATA_MODULES = [
  { key:'inventory', label:'Inventory Master', desc:'Item codes, stock levels, safety stock, reorder points' },
  { key:'consumption', label:'Monthly Consumption', desc:'Month-wise consumption data per item for forecasting' },
  { key:'suppliers', label:'Supplier Master', desc:'Supplier profiles, OTD, quality, compliance scores' },
  { key:'orders', label:'Purchase Orders', desc:'PR/PO data with status, dates, buyer info' },
  { key:'savings', label:'Cost Savings', desc:'Savings activities: PPV, negotiation, localization' },
  { key:'deliveries', label:'Delivery Records', desc:'OTD tracking, delays, quality rejections' },
  { key:'activities', label:'Misc Activities', desc:'Vendor audits, onboarding, procurement tasks' },
];

export default function DataHubPage() {
  const { refreshKey, triggerRefresh, addToast } = useAppContext();
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState(null);
  const [moduleData, setModuleData] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      setLoading(true);
      const c = {};
      for (const m of DATA_MODULES) {
        try { const res = await API.get(`/${m.key}`); c[m.key] = res.data.length; }
        catch { c[m.key] = 0; }
      }
      setCounts(c);
      setLoading(false);
    };
    loadCounts();
  }, [refreshKey]);

  const loadModuleData = async (key) => {
    setActiveModule(key);
    setModuleLoading(true);
    try { const res = await API.get(`/${key}`); setModuleData(res.data); }
    catch(err) { addToast('Failed to load data','error'); }
    setModuleLoading(false);
  };

  const handleSave = async () => {
    try { await API.put(`/${activeModule}/${editingId}`, editData); addToast('Record updated','success'); setEditingId(null); loadModuleData(activeModule); }
    catch(err) { addToast('Update failed','error'); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Delete this record permanently?')) return;
    try { await API.delete(`/${activeModule}/${id}`); addToast('Record deleted','success'); loadModuleData(activeModule); }
    catch(err) { addToast('Delete failed','error'); }
  };

  const handleUploadSuccess = () => {
    if(activeModule) loadModuleData(activeModule);
    triggerRefresh();
  };

  // Get display columns (exclude internal fields)
  const getColumns = () => {
    if(moduleData.length===0) return [];
    const skip = ['_id','__v','createdAt','updatedAt'];
    return Object.keys(moduleData[0]).filter(k=>!skip.includes(k));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Outfit'}}>Centralized Data Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Upload Excel sheets from ERP/Oracle · Manage all master data sources</p>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        {DATA_MODULES.map(m=>(
          <div key={m.key} onClick={()=>loadModuleData(m.key)}
            className={`glass-card p-5 cursor-pointer transition-all ${activeModule===m.key?'border-blue-500/40 shadow-lg shadow-blue-500/10':'hover:border-white/15'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-200">{m.label}</h3>
              {loading ? <Loader size={14} className="text-gray-600 animate-spin"/> : counts[m.key]>0 ? <CheckCircle size={14} className="text-emerald-400"/> : <AlertCircle size={14} className="text-gray-600"/>}
            </div>
            <p className="text-xs text-gray-500 mb-3">{m.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-white">{counts[m.key]||0} <span className="text-xs text-gray-500 font-normal">records</span></span>
              <ExcelUploader module={m.key} onSuccess={handleUploadSuccess} />
            </div>
          </div>
        ))}
      </div>

      {/* Active Module Table */}
      {activeModule && (
        <div className="glass-card overflow-hidden animate-fade-up">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300">{DATA_MODULES.find(m=>m.key===activeModule)?.label} — Data Viewer</h3>
              <p className="text-xs text-gray-500 mt-0.5">{moduleData.length} records · Click any cell to edit</p>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>loadModuleData(activeModule)} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">Reload</button>
            </div>
          </div>

          {moduleLoading ? (
            <div className="p-12 text-center text-gray-600">Loading data...</div>
          ) : moduleData.length===0 ? (
            <div className="p-12 text-center text-gray-600">No records. Upload an Excel file (.xlsx) with matching column headers.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {getColumns().map(col=><th key={col} className="whitespace-nowrap">{col}</th>)}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleData.slice(0,100).map(row=>(
                    <tr key={row._id}>
                      {getColumns().map(col=>(
                        <td key={col}>
                          {editingId===row._id ? (
                            <input value={editData[col]??''} onChange={e=>setEditData({...editData,[col]:e.target.value})}
                              className="editable-input border-blue-500/30 min-w-[80px]"/>
                          ) : (
                            <span className="text-sm">{typeof row[col]==='boolean' ? (row[col]?'Yes':'No') : String(row[col]??'—').substring(0,40)}</span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="flex gap-1">
                          {editingId===row._id ? (
                            <><button onClick={handleSave} className="text-emerald-400 p-1 cursor-pointer"><Save size={14}/></button>
                            <button onClick={()=>setEditingId(null)} className="text-gray-500 p-1 cursor-pointer text-xs">✕</button></>
                          ) : (
                            <><button onClick={()=>{setEditingId(row._id);setEditData({...row});}} className="text-blue-400 p-1 cursor-pointer text-xs">Edit</button>
                            <button onClick={()=>handleDelete(row._id)} className="text-red-400 p-1 cursor-pointer"><Trash2 size={14}/></button></>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
