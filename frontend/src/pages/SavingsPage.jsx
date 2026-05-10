import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import KPICard from '../components/KPICard';
import ExcelUploader from '../components/ExcelUploader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Trash2, Save } from 'lucide-react';

export default function SavingsPage() {
  const { selectedMonth, refreshKey, addToast } = useAppContext();
  const [savings, setSavings] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newSaving, setNewSaving] = useState({savingId:'',month:selectedMonth,year:new Date().getFullYear(),savingType:'Negotiation',itemName:'',supplierName:'',buyer:'',previousRate:0,newRate:0,quantity:0,savingAmount:0,description:''});

  const loadData = async () => {
    setLoading(true);
    try {
      const [savRes, trendRes] = await Promise.all([
        API.get('/savings'),
        API.get(`/dashboard/savings-trend?year=${selectedMonth.split('-')[0]}`)
      ]);
      setSavings(savRes.data);
      // Transform trend data for chart
      const months = {};
      trendRes.data.forEach(d => {
        if (!months[d._id.month]) months[d._id.month] = { month: d._id.month };
        months[d._id.month][d._id.type] = d.total;
      });
      setTrendData(Object.values(months).sort((a,b) => a.month.localeCompare(b.month)));
    } catch(err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [refreshKey, selectedMonth]);

  const handleAdd = async () => {
    if(!newSaving.savingId){addToast('Saving ID required','error');return;}
    const amount = (newSaving.previousRate - newSaving.newRate) * newSaving.quantity;
    try { await API.post('/savings', {...newSaving, savingAmount: amount, annualizedSaving: amount*12}); addToast('Saving added','success'); setShowAdd(false); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleSave = async () => {
    try { await API.put(`/savings/${editingId}`, editData); addToast('Updated','success'); setEditingId(null); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Delete?')) return;
    try { await API.delete(`/savings/${id}`); addToast('Deleted','success'); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };

  const totalSavings = savings.reduce((a,s) => a + (s.savingAmount||0), 0);
  const negSavings = savings.filter(s=>s.savingType==='Negotiation').reduce((a,s) => a+(s.savingAmount||0),0);
  const ppvSavings = savings.filter(s=>s.savingType==='PPV').reduce((a,s) => a+(s.savingAmount||0),0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Outfit'}}>Cost Savings Management</h1>
          <p className="text-sm text-gray-500 mt-1">PPV, negotiation, localization & alternate supplier savings tracker</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelUploader module="savings" onSuccess={loadData} />
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"><Plus size={16}/>Add Saving</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Savings (YTD)" value={`₹${(totalSavings/100000).toFixed(2)}L`} icon="💰" color="green"/>
        <KPICard label="Negotiation" value={`₹${(negSavings/1000).toFixed(0)}K`} icon="🤝" color="blue"/>
        <KPICard label="PPV Savings" value={`₹${(ppvSavings/1000).toFixed(0)}K`} icon="📊" color="purple"/>
        <KPICard label="Activities Logged" value={savings.length} icon="📋" color="amber"/>
      </div>

      {showAdd&&(
        <div className="glass-card p-5 mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Log New Cost Saving</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['savingId','month','savingType','itemName','supplierName','buyer','previousRate','newRate','quantity','description'].map(k=>(
              <div key={k}><label className="text-xs text-gray-500 block mb-1">{k}</label>
              {k==='savingType'?
                <select value={newSaving[k]} onChange={e=>setNewSaving({...newSaving,[k]:e.target.value})} className="editable-input border-white/10 w-full bg-transparent">
                  {['Negotiation','PPV','Localization','Alternate Supplier','Process Improvement','Other'].map(o=><option key={o} value={o} className="bg-gray-900">{o}</option>)}
                </select>
              :<input value={newSaving[k]} onChange={e=>setNewSaving({...newSaving,[k]:e.target.value})} className="editable-input border-white/10 w-full"/>}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg cursor-pointer">Save</button>
            <button onClick={()=>setShowAdd(false)} className="text-sm text-gray-400 px-4 py-2 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Monthly Savings Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/><XAxis dataKey="month" tick={{fontSize:10,fill:'#6b7280'}}/><YAxis tick={{fontSize:10,fill:'#6b7280'}}/><Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff'}}/><Legend/>
              <Bar dataKey="Negotiation" stackId="a" fill="#3b82f6" radius={[0,0,0,0]}/>
              <Bar dataKey="PPV" stackId="a" fill="#10b981" radius={[0,0,0,0]}/>
              <Bar dataKey="Localization" stackId="a" fill="#f59e0b" radius={[0,0,0,0]}/>
              <Bar dataKey="Alternate Supplier" stackId="a" fill="#8b5cf6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Savings by Buyer</h3>
          {(() => {
            const byBuyer = {};
            savings.forEach(s => { const b = s.buyer||'Unassigned'; byBuyer[b] = (byBuyer[b]||0)+(s.savingAmount||0); });
            const data = Object.entries(byBuyer).map(([name,value])=>({name,value})).sort((a,b)=>b.value-a.value);
            return <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/><XAxis type="number" tick={{fontSize:10,fill:'#6b7280'}}/><YAxis dataKey="name" type="category" tick={{fontSize:10,fill:'#6b7280'}} width={100}/><Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'#fff'}}/><Bar dataKey="value" fill="#10b981" radius={[0,4,4,0]}/></BarChart>
            </ResponsiveContainer>;
          })()}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 pt-5 pb-2"><h3 className="text-sm font-semibold text-gray-300">Savings Activity Log</h3></div>
        <table className="data-table">
          <thead><tr><th>ID</th><th>Month</th><th>Type</th><th>Item</th><th>Supplier</th><th>Buyer</th><th>Prev Rate</th><th>New Rate</th><th>Qty</th><th>Saving</th><th>Actions</th></tr></thead>
          <tbody>
            {savings.length===0?<tr><td colSpan={11} className="text-center py-8 text-gray-600">No savings data. Upload Excel or add manually.</td></tr>
            :savings.map(s=>(
              <tr key={s._id}>
                <td className="text-xs font-mono">{s.savingId}</td>
                <td>{s.month}</td>
                <td><span className="badge badge-info">{s.savingType}</span></td>
                <td>{editingId===s._id?<input value={editData.itemName} onChange={e=>setEditData({...editData,itemName:e.target.value})} className="editable-input border-blue-500/30 w-24"/>:s.itemName}</td>
                <td>{s.supplierName}</td><td>{s.buyer}</td>
                <td>₹{s.previousRate}</td><td>₹{s.newRate}</td><td>{s.quantity}</td>
                <td className="font-bold text-emerald-400">₹{(s.savingAmount||0).toLocaleString()}</td>
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
