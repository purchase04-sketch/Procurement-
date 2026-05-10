import { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import API from '../lib/api';
import KPICard from '../components/KPICard';
import ExcelUploader from '../components/ExcelUploader';
import { Plus, Trash2, Save } from 'lucide-react';

export default function OrdersPage() {
  const { selectedMonth, refreshKey, addToast } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('All');
  const [newOrder, setNewOrder] = useState({poNumber:'',prNumber:'',itemCode:'',itemName:'',supplierCode:'',supplierName:'',buyer:'',quantity:0,unitPrice:0,totalValue:0,status:'Draft',month:selectedMonth,isEmergency:false});

  const loadData = async () => {
    setLoading(true);
    try { const res = await API.get(`/orders?month=${selectedMonth}`); setOrders(res.data); }
    catch(err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [refreshKey, selectedMonth]);

  const handleAdd = async () => {
    if(!newOrder.poNumber){addToast('PO Number required','error');return;}
    const tv = newOrder.quantity * newOrder.unitPrice;
    try { await API.post('/orders', {...newOrder, totalValue:tv}); addToast('PO created','success'); setShowAdd(false); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleSave = async () => {
    try { await API.put(`/orders/${editingId}`, editData); addToast('Updated','success'); setEditingId(null); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };
  const handleDelete = async (id) => {
    if(!confirm('Delete this PO?')) return;
    try { await API.delete(`/orders/${id}`); addToast('Deleted','success'); loadData(); }
    catch(err) { addToast('Failed','error'); }
  };

  const statuses = ['All','Draft','Pending Approval','Approved','In Transit','Completed','Delayed','Cancelled'];
  const filtered = filter==='All' ? orders : orders.filter(o=>o.status===filter);
  const totalValue = orders.reduce((a,o)=>a+(o.totalValue||0),0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Outfit'}}>Purchase Orders (PR/PO)</h1>
          <p className="text-sm text-gray-500 mt-1">Order tracking, approvals, and delivery monitoring for {selectedMonth}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelUploader module="orders" onSuccess={loadData} />
          <button onClick={()=>setShowAdd(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer"><Plus size={16}/>Create PO</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Orders" value={orders.length} icon="📋" color="blue"/>
        <KPICard label="Total Value" value={`₹${(totalValue/100000).toFixed(2)}L`} icon="💰" color="green"/>
        <KPICard label="Pending Approval" value={orders.filter(o=>o.status==='Pending Approval').length} icon="⏳" color="amber"/>
        <KPICard label="Delayed" value={orders.filter(o=>o.status==='Delayed').length} icon="🚨" color="red"/>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statuses.map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`text-xs px-3 py-1.5 rounded-lg cursor-pointer transition ${filter===s?'bg-blue-500/20 text-blue-400 font-semibold':'bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]'}`}>{s}</button>
        ))}
      </div>

      {showAdd&&(
        <div className="glass-card p-5 mb-6 animate-fade-up">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Create Purchase Order</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['poNumber','prNumber','itemCode','itemName','supplierCode','supplierName','buyer','quantity','unitPrice','month'].map(k=>(
              <div key={k}><label className="text-xs text-gray-500 block mb-1">{k}</label>
              <input value={newOrder[k]} onChange={e=>setNewOrder({...newOrder,[k]:e.target.value})} className="editable-input border-white/10 w-full"/></div>
            ))}
            <div><label className="text-xs text-gray-500 block mb-1">Status</label>
              <select value={newOrder.status} onChange={e=>setNewOrder({...newOrder,status:e.target.value})} className="editable-input border-white/10 w-full bg-transparent">
                {statuses.filter(s=>s!=='All').map(s=><option key={s} value={s} className="bg-gray-900">{s}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={newOrder.isEmergency} onChange={e=>setNewOrder({...newOrder,isEmergency:e.target.checked})}/>Emergency PO
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-emerald-500 text-white text-sm px-4 py-2 rounded-lg cursor-pointer">Save</button>
            <button onClick={()=>setShowAdd(false)} className="text-sm text-gray-400 px-4 py-2 cursor-pointer">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>PO #</th><th>PR #</th><th>Item</th><th>Supplier</th><th>Buyer</th><th>Qty</th><th>Value</th><th>Status</th><th>Emergency</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.length===0?<tr><td colSpan={10} className="text-center py-8 text-gray-600">No orders found.</td></tr>
            :filtered.map(o=>(
              <tr key={o._id}>
                <td className="font-mono text-sm">{o.poNumber}</td>
                <td className="text-xs">{o.prNumber||'—'}</td>
                <td>{editingId===o._id?<input value={editData.itemName} onChange={e=>setEditData({...editData,itemName:e.target.value})} className="editable-input border-blue-500/30 w-28"/>:o.itemName||o.itemCode}</td>
                <td>{o.supplierName||o.supplierCode}</td>
                <td>{o.buyer||'—'}</td>
                <td>{o.quantity}</td>
                <td className="font-semibold">₹{(o.totalValue||0).toLocaleString()}</td>
                <td>{editingId===o._id?
                  <select value={editData.status} onChange={e=>setEditData({...editData,status:e.target.value})} className="editable-input border-blue-500/30 w-28 bg-transparent text-xs">
                    {statuses.filter(s=>s!=='All').map(s=><option key={s} value={s} className="bg-gray-900">{s}</option>)}
                  </select>
                  :<span className={`badge ${o.status==='Completed'?'badge-success':o.status==='Delayed'?'badge-danger':o.status==='Pending Approval'?'badge-warning':'badge-info'}`}>{o.status}</span>}</td>
                <td>{o.isEmergency?<span className="badge badge-danger">⚡ Yes</span>:'—'}</td>
                <td><div className="flex gap-1">
                  {editingId===o._id?<><button onClick={handleSave} className="text-emerald-400 p-1 cursor-pointer"><Save size={14}/></button><button onClick={()=>setEditingId(null)} className="text-gray-500 p-1 cursor-pointer text-xs">✕</button></>
                  :<><button onClick={()=>{setEditingId(o._id);setEditData({...o});}} className="text-blue-400 p-1 cursor-pointer text-xs">Edit</button><button onClick={()=>handleDelete(o._id)} className="text-red-400 p-1 cursor-pointer"><Trash2 size={14}/></button></>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
