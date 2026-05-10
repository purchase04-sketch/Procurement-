import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import KPICard from '../components/KPICard';
import ExcelUploader from '../components/ExcelUploader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Save } from 'lucide-react';

export default function SuppliersPage() {
  const { refreshKey, addToast } = useAppContext();
  const [suppliers, setSuppliers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newSup, setNewSup] = useState({supplierCode:'',supplierName:'',category:'',contactPerson:'',email:'',leadTimeDays:7,paymentTerms:'Net 30',riskLevel:'Medium',otdScore:0,qualityScore:0,complianceScore:0});

  const loadData = async () => {
    setLoading(true);
    try {
      const [supRes, delRes] = await Promise.all([API.get('/dashboard/supplier-performance'), API.get('/deliveries')]);
      setSuppliers(supRes.data); setDeliveries(delRes.data);
    } catch(err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [refreshKey]);

  const handleAdd = async () => {
    if(!newSup.supplierCode||!newSup.supplierName){addToast('Code & Name required','error');return;}
    try { await API.post('/suppliers', newSup); addToast('Supplier added','success'); setShowAdd(false); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleSave = async () => {
    try { await API.put(`/suppliers/${editingId}`, editData); addToast('Updated','success'); setEditingId(null); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Delete supplier?')) return;
    try { await API.delete(`/suppliers/${id}`); addToast('Deleted','success'); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };

  const avgOTD = suppliers.length>0 ? Math.round(suppliers.reduce((a,s)=>a+(s.otdScore||0),0)/suppliers.length) : 0;
  const avgQuality = suppliers.length>0 ? Math.round(suppliers.reduce((a,s)=>a+(s.qualityScore||0),0)/suppliers.length) : 0;
  const highRisk = suppliers.filter(s=>s.riskLevel==='High').length;
  const chartData = suppliers.map(s=>({name:(s.supplierName||'').substring(0,12),score:s.performanceScore||0,otd:s.otdScore||0}));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Outfit'}}>Supplier Performance & OTD</h1>
          <p className="text-sm text-gray-500 mt-1">Scorecards, delivery tracking, and risk categorization</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelUploader module="suppliers" onSuccess={loadData} />
          <ExcelUploader module="deliveries" onSuccess={loadData} />
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"><Plus size={16}/>Add Supplier</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Avg OTD Score" value={`${avgOTD}%`} icon="📦" color="green"/>
        <KPICard label="Avg Quality" value={`${avgQuality}%`} icon="✅" color="blue"/>
        <KPICard label="High Risk" value={highRisk} icon="🚨" color="red"/>
        <KPICard label="Total Suppliers" value={suppliers.length} icon="🤝" color="purple"/>
      </div>

      {showAdd&&(
        <div className="glass-card p-5 mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Add Supplier</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(newSup).map(([k,v])=>(
              <div key={k}><label className="text-xs text-gray-500 block mb-1">{k}</label>
              {k==='riskLevel'?<select value={v} onChange={e=>setNewSup({...newSup,[k]:e.target.value})} className="editable-input border-white/10 w-full bg-transparent"><option className="bg-gray-900" value="Low">Low</option><option className="bg-gray-900" value="Medium">Medium</option><option className="bg-gray-900" value="High">High</option></select>
              :<input value={v} onChange={e=>setNewSup({...newSup,[k]:e.target.value})} className="editable-input border-white/10 w-full"/>}</div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg cursor-pointer">Save</button>
            <button onClick={()=>setShowAdd(false)} className="text-sm text-gray-400 px-4 py-2 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Supplier Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/><XAxis dataKey="name" tick={{fontSize:10,fill:'#6b7280'}}/><YAxis domain={[0,100]} tick={{fontSize:10,fill:'#6b7280'}}/><Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff'}}/><Bar dataKey="score" fill="#3b82f6" radius={[4,4,0,0]} name="Overall Score"/><Bar dataKey="otd" fill="#10b981" radius={[4,4,0,0]} name="OTD %"/></BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-2"><h3 className="text-sm font-semibold text-gray-300">Supplier Scorecard</h3></div>
        <table className="data-table">
          <thead><tr><th>Supplier</th><th>Category</th><th>OTD %</th><th>Quality %</th><th>Compliance %</th><th>Lead Time</th><th>Risk</th><th>Score</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.length===0?<tr><td colSpan={9} className="text-center py-8 text-gray-600">No suppliers. Upload Excel or add manually.</td></tr>
            :suppliers.map(s=>(
              <tr key={s._id}>
                <td><div className="font-medium text-gray-200">{editingId===s._id?<input value={editData.supplierName} onChange={e=>setEditData({...editData,supplierName:e.target.value})} className="editable-input border-blue-500/30"/>:s.supplierName}</div><div className="text-xs text-gray-500">{s.supplierCode}</div></td>
                <td>{s.category}</td>
                <td>{editingId===s._id?<input type="number" value={editData.otdScore} onChange={e=>setEditData({...editData,otdScore:+e.target.value})} className="editable-input border-blue-500/30 w-16"/>:s.otdScore}%</td>
                <td>{s.qualityScore}%</td><td>{s.complianceScore}%</td><td>{s.leadTimeDays}d</td>
                <td><span className={`badge ${s.riskLevel==='Low'?'badge-success':s.riskLevel==='High'?'badge-danger':'badge-warning'}`}>{s.riskLevel}</span></td>
                <td><div className="flex items-center gap-2"><span className="font-bold text-white">{s.performanceScore}</span><div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-400" style={{width:`${s.performanceScore}%`}}/></div></div></td>
                <td><div className="flex gap-1">
                  {editingId===s._id?<><button onClick={handleSave} className="text-emerald-400 p-1 cursor-pointer"><Save size={14}/></button><button onClick={()=>setEditingId(null)} className="text-gray-500 p-1 cursor-pointer text-xs">✕</button></>
                  :<><button onClick={()=>{setEditingId(s._id);setEditData({...s});}} className="text-blue-400 p-1 cursor-pointer text-xs">Edit</button><button onClick={()=>handleDelete(s._id)} className="text-red-400 p-1 cursor-pointer"><Trash2 size={14}/></button></>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
