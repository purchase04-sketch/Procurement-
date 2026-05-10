import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { DollarSign, Target, Download, Plus, Trash2, Edit3, Save, X, MessageCircle, Send, Bot, Sparkles } from 'lucide-react';

const CostSavings = () => {
  const [savings, setSavings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'bot', text: 'Hi! I\'m the Cost Savings Assistant. Tell me what saving you achieved and I\'ll create the entry.\n\nExample: "Negotiated 5% discount on item BOLT-100 with supplier SUP-001, previous rate was ₹50, new rate ₹47.50 for 1000 qty, buyer is Buyer A"' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  const month = localStorage.getItem('activeMonth') || '2026-04';
  const buyer = localStorage.getItem('activeBuyer') || 'All Buyers';

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/savingdata?month=${month}`);
      setSavings(res.data);
    } catch { setSavings([]); }
    setLoading(false);
  };

  const filteredSavings = buyer === 'All Buyers' ? savings : savings.filter(s => s.buyer === buyer);

  /* ── Auto-calculations ── */
  const totalSavings = filteredSavings.reduce((s, r) => s + (r.actualSaving || (r.previousRate - r.newRate) * r.quantity || 0), 0);
  const totalTarget = filteredSavings.reduce((s, r) => s + (r.targetSaving || 0), 0);
  const pct = totalTarget > 0 ? Math.round((totalSavings / totalTarget) * 100) : 0;

  /* ── Add Row ── */
  const handleAdd = () => {
    const newRow = {
      _tempId: Date.now(),
      savingType: 'Negotiation',
      itemCode: '',
      itemName: '',
      supplierCode: '',
      supplierName: '',
      buyer: buyer === 'All Buyers' ? 'Buyer A' : buyer,
      previousRate: 0,
      newRate: 0,
      quantity: 0,
      month,
      targetSaving: 0,
      actualSaving: 0,
    };
    setSavings([newRow, ...savings]);
    setEditingId(newRow._tempId);
    setEditValues(newRow);
  };

  /* ── Delete Row ── */
  const handleDelete = async (row) => {
    if (!confirm('Delete this saving entry?')) return;
    if (row._id) {
      try { await axios.delete(`http://localhost:5000/api/savingdata/${row._id}`); } catch {}
    }
    setSavings(savings.filter(s => (s._id || s._tempId) !== (row._id || row._tempId)));
  };

  /* ── Save Row ── */
  const handleSave = async () => {
    const actualSaving = (editValues.previousRate - editValues.newRate) * editValues.quantity;
    const data = { ...editValues, actualSaving, month };
    try {
      if (editValues._id) {
        await axios.put(`http://localhost:5000/api/savingdata/${editValues._id}`, data);
      } else {
        await axios.post('http://localhost:5000/api/savingdata', data);
      }
      setEditingId(null);
      fetchData();
    } catch (err) {
      // If DB is down, update locally
      const actualSaving = (editValues.previousRate - editValues.newRate) * editValues.quantity;
      setSavings(savings.map(s => (s._id || s._tempId) === (editValues._id || editValues._tempId) ? { ...editValues, actualSaving } : s));
      setEditingId(null);
    }
  };

  /* ── Download Excel ── */
  const handleDownload = () => {
    const rows = filteredSavings.map(s => ({
      'Saving Type': s.savingType,
      'Item Code': s.itemCode,
      'Item Name': s.itemName,
      'Supplier Code': s.supplierCode,
      'Supplier Name': s.supplierName,
      'Buyer': s.buyer,
      'Previous Rate (₹)': s.previousRate,
      'New Rate (₹)': s.newRate,
      'Quantity': s.quantity,
      'Saving Amount (₹)': s.actualSaving || (s.previousRate - s.newRate) * s.quantity,
      'Target (₹)': s.targetSaving,
      'Month': s.month
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cost Savings');
    XLSX.writeFile(wb, `Cost_Savings_${month}.xlsx`);
  };

  /* ── Chatbot: parse user message and create a saving entry ── */
  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');

    // Parse the user message
    setTimeout(() => {
      const parsed = parseSavingFromText(userMsg);
      if (parsed) {
        const actualSaving = (parsed.previousRate - parsed.newRate) * parsed.quantity;
        const newEntry = { ...parsed, actualSaving, month, _tempId: Date.now() };
        setSavings(prev => [newEntry, ...prev]);

        // Try saving to DB
        axios.post('http://localhost:5000/api/savingdata', { ...parsed, actualSaving, month }).catch(() => {});

        setChatMessages(prev => [...prev, {
          role: 'bot',
          text: `✅ Created! Here's what I added:\n\n• Type: ${parsed.savingType}\n• Item: ${parsed.itemCode} — ${parsed.itemName}\n• Supplier: ${parsed.supplierCode}\n• Buyer: ${parsed.buyer}\n• Old Rate: ₹${parsed.previousRate} → New: ₹${parsed.newRate}\n• Qty: ${parsed.quantity}\n• **Saving: ₹${actualSaving.toLocaleString()}**\n\nAnything else?`
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: 'bot',
          text: '❓ I couldn\'t parse that. Please include:\n• Item code\n• Supplier code\n• Previous rate and new rate\n• Quantity\n• Buyer name\n\nExample: "PPV saving on item MOTOR-200, supplier SUP-005, old rate 1200, new rate 1100, qty 500, buyer Buyer B"'
        }]);
      }
    }, 500);
  };

  /* ── Simple NLP parser ── */
  const parseSavingFromText = (text) => {
    const t = text.toLowerCase();
    let savingType = 'Negotiation';
    if (t.includes('ppv')) savingType = 'PPV';
    if (t.includes('alternate')) savingType = 'Alternate Supplier';
    if (t.includes('locali')) savingType = 'Localization';
    if (t.includes('process')) savingType = 'Process Improvement';

    // Extract item code
    const itemMatch = text.match(/item[:\s]+([A-Z0-9\-]+)/i) || text.match(/([A-Z]{2,}[\-][A-Z0-9]+)/i);
    const itemCode = itemMatch ? itemMatch[1].toUpperCase() : '';

    // Extract supplier
    const supMatch = text.match(/supplier[:\s]+([A-Z0-9\-]+)/i) || text.match(/(SUP[\-][0-9]+)/i);
    const supplierCode = supMatch ? supMatch[1].toUpperCase() : '';

    // Extract rates
    const rateMatches = text.match(/(\d+\.?\d*)/g);
    const rates = rateMatches ? rateMatches.map(Number) : [];

    // Extract buyer
    const buyerMatch = text.match(/buyer[:\s]+(buyer\s*[a-e])/i) || text.match(/(buyer\s*[a-e])/i);
    const buyerName = buyerMatch ? buyerMatch[1].replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : (buyer === 'All Buyers' ? 'Buyer A' : buyer);

    if (!itemCode || rates.length < 3) return null;

    // Assume rates are: [previous, new, qty] in order of largest to smallest for rates
    let previousRate = 0, newRate = 0, quantity = 0;
    if (rates.length >= 3) {
      // Find the two rate-like numbers and the qty-like number
      const sorted = [...rates].sort((a, b) => b - a);
      quantity = sorted[0]; // largest is usually qty
      previousRate = sorted[1];
      newRate = sorted[2];
      // If qty seems too small, swap
      if (quantity < previousRate) {
        [quantity, previousRate, newRate] = [sorted[0], sorted[1], sorted[2]];
      }
      // Try specific patterns
      const prevMatch = text.match(/(?:previous|old|prev)\s*(?:rate|price)?[:\s]*₹?\s*(\d+\.?\d*)/i);
      const newMatch = text.match(/(?:new|current|revised)\s*(?:rate|price)?[:\s]*₹?\s*(\d+\.?\d*)/i);
      const qtyMatch = text.match(/(?:qty|quantity|nos|pcs)[:\s]*(\d+)/i);
      if (prevMatch) previousRate = Number(prevMatch[1]);
      if (newMatch) newRate = Number(newMatch[1]);
      if (qtyMatch) quantity = Number(qtyMatch[1]);
    }

    return {
      savingType,
      itemCode,
      itemName: itemCode,
      supplierCode,
      supplierName: supplierCode,
      buyer: buyerName,
      previousRate,
      newRate,
      quantity,
      targetSaving: 0
    };
  };

  const ECell = ({ val, field, type = 'text' }) => {
    if (editingId !== (editValues._id || editValues._tempId)) return <span>{val}</span>;
    return <input type={type} value={editValues[field] ?? val} onChange={e => setEditValues({...editValues, [field]: type === 'number' ? Number(e.target.value) : e.target.value})} className="input-field" style={{ padding: '4px 8px', width: type === 'number' ? '80px' : '100px', fontSize: '0.8rem' }} />;
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Cost Savings</h2>
          <p style={{ color: 'var(--text-dim)' }}>Track negotiation, PPV, and alternate supplier savings {buyer !== 'All Buyers' && `· ${buyer}`}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Row
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            <Download size={16} /> Download Excel
          </button>
          <button onClick={() => setShowChat(!showChat)} style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Sparkles size={16} /> AI Assistant
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)' }}>
          <DollarSign color="var(--success)" size={20} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '12px' }}>₹{totalSavings.toLocaleString()}</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Actual Savings</p>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <Target color="var(--primary)" size={20} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '12px' }}>₹{totalTarget.toLocaleString()}</h3>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Target Savings</p>
        </div>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '12px', color: pct >= 100 ? 'var(--success)' : pct >= 80 ? 'var(--warning)' : 'var(--danger)' }}>{pct}%</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Achievement vs Target</p>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-input)', borderRadius: '3px', marginTop: '8px' }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: pct >= 100 ? 'var(--success)' : 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s' }}></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ margin: '0', width: '100%' }}>
            <thead>
              <tr><th>Type</th><th>Item</th><th>Supplier</th><th>Buyer</th><th>Prev Rate ₹</th><th>New Rate ₹</th><th>Qty</th><th>Saving ₹</th><th>Target ₹</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredSavings.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>No savings data. Click "Add Row" or use the AI Assistant.</td></tr>
              ) : filteredSavings.map((s, i) => {
                const id = s._id || s._tempId;
                const isEditing = editingId === id;
                const saving = (s.previousRate - s.newRate) * s.quantity;
                return (
                  <tr key={id || i}>
                    <td>
                      {isEditing ? (
                        <select value={editValues.savingType} onChange={e => setEditValues({...editValues, savingType: e.target.value})} className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }}>
                          <option>Negotiation</option><option>PPV</option><option>Alternate Supplier</option><option>Localization</option><option>Process Improvement</option>
                        </select>
                      ) : <span className="badge" style={{ background: 'var(--bg-input)' }}>{s.savingType}</span>}
                    </td>
                    <td>
                      {isEditing ? <input className="input-field" style={{ padding: '4px 8px', width: '90px', fontSize: '0.8rem' }} value={editValues.itemCode} onChange={e => setEditValues({...editValues, itemCode: e.target.value, itemName: e.target.value})} /> : <><div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{s.itemCode}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{s.itemName}</div></>}
                    </td>
                    <td>{isEditing ? <input className="input-field" style={{ padding: '4px 8px', width: '80px', fontSize: '0.8rem' }} value={editValues.supplierCode} onChange={e => setEditValues({...editValues, supplierCode: e.target.value})} /> : s.supplierCode}</td>
                    <td>{isEditing ? <select value={editValues.buyer} onChange={e => setEditValues({...editValues, buyer: e.target.value})} className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }}><option>Buyer A</option><option>Buyer B</option><option>Buyer C</option><option>Buyer D</option><option>Buyer E</option></select> : <span style={{ fontSize: '0.8rem' }}>{s.buyer}</span>}</td>
                    <td>{isEditing ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.previousRate} onChange={e => setEditValues({...editValues, previousRate: Number(e.target.value)})} /> : `₹${s.previousRate}`}</td>
                    <td>{isEditing ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.newRate} onChange={e => setEditValues({...editValues, newRate: Number(e.target.value)})} /> : <span style={{ color: 'var(--success)' }}>₹{s.newRate}</span>}</td>
                    <td>{isEditing ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.quantity} onChange={e => setEditValues({...editValues, quantity: Number(e.target.value)})} /> : s.quantity}</td>
                    <td style={{ fontWeight: '700', color: saving > 0 ? 'var(--success)' : 'var(--text-muted)' }}>₹{saving.toLocaleString()}</td>
                    <td>{isEditing ? <input type="number" className="input-field" style={{ padding: '4px 8px', width: '70px', fontSize: '0.8rem' }} value={editValues.targetSaving} onChange={e => setEditValues({...editValues, targetSaving: Number(e.target.value)})} /> : `₹${s.targetSaving || 0}`}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {isEditing ? (
                          <>
                            <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: 'var(--success)', cursor: 'pointer' }}><Save size={16} /></button>
                            <button onClick={() => setEditingId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(id); setEditValues({...s}); }} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                            <button onClick={() => handleDelete(s)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI Chatbot Panel ── */}
      {showChat && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '420px', maxHeight: '550px', background: 'var(--bg-sidebar)', border: '1px solid var(--border)', borderRadius: '16px', display: 'flex', flexDirection: 'column', zIndex: 1000, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1))', borderRadius: '16px 16px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bot size={20} color="#8b5cf6" />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Cost Savings AI</h4>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Describe your saving, I'll create the entry</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px' }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-input)',
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Describe the cost saving..."
              className="input-field"
              style={{ flex: 1, fontSize: '0.8rem' }}
            />
            <button onClick={handleChatSend} style={{ background: 'var(--primary)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostSavings;
