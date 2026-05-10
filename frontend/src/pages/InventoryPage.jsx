import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import KPICard from '../components/KPICard';
import ExcelUploader from '../components/ExcelUploader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, Trash2, Save } from 'lucide-react';

export default function InventoryPage() {
  const { selectedMonth, refreshKey, addToast } = useAppContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ itemCode:'', itemName:'', category:'', unit:'Units', currentStock:0, safetyStock:0, reorderPoint:0, leadTimeDays:7 });

  const loadData = async () => {
    setLoading(true);
    try { const res = await API.get('/dashboard/inventory-forecast'); setItems(res.data); }
    catch(err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [refreshKey, selectedMonth]);

  const handleSave = async () => {
    try { await API.put(`/inventory/${editingId}`, editData); addToast('Item updated','success'); setEditingId(null); loadData(); }
    catch(err) { addToast('Update failed','error'); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Delete this item?')) return;
    try { await API.delete(`/inventory/${id}`); addToast('Item deleted','success'); loadData(); }
    catch(err) { addToast('Delete failed','error'); }
  };
  const handleAdd = async () => {
    if(!newItem.itemCode||!newItem.itemName){addToast('Code & Name required','error');return;}
    try { await API.post('/inventory', newItem); addToast('Item added','success'); setShowAdd(false); loadData(); }
    catch(err) { addToast('Add failed','error'); }
  };

  const criticalCount = items.filter(i=>i.calcStatus==='Critical').length;
  const riskCount = items.filter(i=>i.calcStatus==='Risk').length;
  const coverageData = items.map(i=>({name:(i.itemName||'').substring(0,10),days:Math.min(i.coverageDays||0,300)}));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Outfit'}}>Inventory Planning & Forecasting</h1>
          <p className="text-sm text-gray-500 mt-1">AI-driven reorder points and 2-month demand forecasting</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelUploader module="inventory" onSuccess={loadData} />
          <ExcelUploader module="consumption" onSuccess={loadData} />
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"><Plus size={16}/>Add Item</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Items" value={items.length} icon="📦" color="blue"/>
        <KPICard label="Critical Stock" value={criticalCount} icon="🚨" color="red"/>
        <KPICard label="Risk Items" value={riskCount} icon="⚠️" color="amber"/>
        <KPICard label="Suggested Orders" value={items.reduce((a,i)=>a+(i.suggestedOrder||0),0)} icon="🛒" color="purple"/>
      </div>

      {showAdd&&(
        <div className="glass-card p-5 mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Add New Inventory Item</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(newItem).map(([k,v])=>(
              <div key={k}><label className="text-xs text-gray-500 block mb-1">{k}</label>
              <input value={v} onChange={e=>setNewItem({...newItem,[k]:e.target.value})} className="editable-input border-white/10 w-full"/></div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg cursor-pointer"><Save size={14} className="inline mr-1"/>Save</button>
            <button onClick={()=>setShowAdd(false)} className="text-sm text-gray-400 px-4 py-2 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden mb-6">
        <table className="data-table">
          <thead><tr><th>Item</th><th>Stock</th><th>Safety</th><th>ROP</th><th>Next Mo.</th><th>+2 Mo.</th><th>Suggested</th><th>Coverage</th><th>Lead</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading?<tr><td colSpan={11} className="text-center py-8 text-gray-600">Loading...</td></tr>
            :items.length===0?<tr><td colSpan={11} className="text-center py-8 text-gray-600">No data. Upload Excel or add items.</td></tr>
            :items.map(item=>(
              <tr key={item._id}>
                <td><div className="font-medium text-gray-200">{editingId===item._id?<input value={editData.itemName} onChange={e=>setEditData({...editData,itemName:e.target.value})} className="editable-input border-blue-500/30"/>:item.itemName}</div><div className="text-xs text-gray-500">{item.itemCode}·{item.category}</div></td>
                <td>{editingId===item._id?<input type="number" value={editData.currentStock} onChange={e=>setEditData({...editData,currentStock:+e.target.value})} className="editable-input border-blue-500/30 w-20"/>:item.currentStock} {item.unit}</td>
                <td>{item.safetyStock}</td><td>{item.reorderPoint}</td>
                <td className="font-semibold text-blue-400">{item.forecastNextMonth}</td>
                <td className="text-blue-300">{item.forecastMonthAfter}</td>
                <td><span className={`font-bold ${item.suggestedOrder>0?'text-amber-400':'text-emerald-400'}`}>{item.suggestedOrder}</span></td>
                <td><span className="text-sm">{item.coverageDays>300?'300+':item.coverageDays}d</span></td>
                <td>{item.leadTimeDays}d</td>
                <td><span className={`badge ${item.calcStatus==='Critical'?'badge-danger':item.calcStatus==='Risk'?'badge-warning':'badge-success'}`}>{item.calcStatus}</span></td>
                <td><div className="flex gap-1">
                  {editingId===item._id?<><button onClick={handleSave} className="text-emerald-400 p-1 cursor-pointer"><Save size={14}/></button><button onClick={()=>setEditingId(null)} className="text-gray-500 p-1 cursor-pointer text-xs">✕</button></>
                  :<><button onClick={()=>{setEditingId(item._id);setEditData({...item});}} className="text-blue-400 p-1 cursor-pointer text-xs">Edit</button><button onClick={()=>handleDelete(item._id)} className="text-red-400 p-1 cursor-pointer"><Trash2 size={14}/></button></>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Stock Coverage (Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={coverageData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/><XAxis dataKey="name" tick={{fontSize:10,fill:'#6b7280'}}/><YAxis tick={{fontSize:10,fill:'#6b7280'}}/><Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff'}}/><Bar dataKey="days" fill="#3b82f6" radius={[4,4,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Category Risk Heatmap</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(items.reduce((acc,i)=>{const c=i.category||'Other';if(!acc[c])acc[c]={total:0,critical:0,risk:0};acc[c].total++;if(i.calcStatus==='Critical')acc[c].critical++;if(i.calcStatus==='Risk')acc[c].risk++;return acc;},{})).map(([cat,d])=>(
              <div key={cat} className={`p-4 rounded-xl text-center ${d.critical>0?'bg-red-500/15 border border-red-500/20':d.risk>0?'bg-amber-500/15 border border-amber-500/20':'bg-emerald-500/15 border border-emerald-500/20'}`}>
                <div className="text-sm font-semibold text-gray-200">{cat}</div>
                <div className="text-xs text-gray-400 mt-1">{d.total} items · {d.critical} critical</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
