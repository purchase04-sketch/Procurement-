const express = require('express');
const multer  = require('multer');
const XLSX    = require('xlsx');
const path    = require('path');
const { Inventory, Consumption, Supplier, PurchaseOrder, CostSaving, Delivery, Activity } = require('../models');

const router = express.Router();

/* ── Multer config ── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.xlsx','.xls','.csv'].includes(ext)) cb(null, true);
  else cb(new Error('Only Excel/CSV files are allowed'), false);
}});

/* ══════════════════════════════════════════
   EXCEL UPLOAD — parse sheets & upsert
   ══════════════════════════════════════════ */
router.post('/upload/:module', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    const module = req.params.module;
    let result = { inserted: 0, updated: 0 };

    const modelMap = {
      inventory:    { Model: Inventory,     key: 'itemCode' },
      consumption:  { Model: Consumption,   key: null },   // composite key
      suppliers:    { Model: Supplier,       key: 'supplierCode' },
      orders:       { Model: PurchaseOrder,  key: 'poNumber' },
      savings:      { Model: CostSaving,     key: 'savingId' },
      deliveries:   { Model: Delivery,       key: 'deliveryId' },
      activities:   { Model: Activity,       key: null },
    };

    const cfg = modelMap[module];
    if (!cfg) return res.status(400).json({ error: `Unknown module: ${module}` });

    for (const row of rows) {
      // normalise column headers → camelCase
      const doc = {};
      Object.entries(row).forEach(([k, v]) => {
        const camel = k.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/).map((w, i) =>
          i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        ).join('');
        doc[camel] = v;
      });

      if (module === 'consumption') {
        const filter = { itemCode: doc.itemCode, month: doc.month };
        const existing = await Consumption.findOne(filter);
        if (existing) { await Consumption.updateOne(filter, { $set: doc }); result.updated++; }
        else { await Consumption.create(doc); result.inserted++; }
      } else if (module === 'activities') {
        await Activity.create(doc);
        result.inserted++;
      } else {
        const filter = { [cfg.key]: doc[cfg.key] };
        const existing = await cfg.Model.findOne(filter);
        if (existing) { await cfg.Model.updateOne(filter, { $set: doc }); result.updated++; }
        else { await cfg.Model.create(doc); result.inserted++; }
      }
    }

    res.json({ success: true, module, rows: rows.length, ...result });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ══════════════════════════════════════════
   GENERIC CRUD ROUTES
   ══════════════════════════════════════════ */
const modules = {
  inventory:   Inventory,
  suppliers:   Supplier,
  orders:      PurchaseOrder,
  savings:     CostSaving,
  deliveries:  Delivery,
  activities:  Activity,
  consumption: Consumption,
};

Object.entries(modules).forEach(([route, Model]) => {
  // GET all (with optional month filter)
  router.get(`/${route}`, async (req, res) => {
    try {
      const filter = {};
      if (req.query.month)    filter.month = req.query.month;
      if (req.query.year)     filter.year  = parseInt(req.query.year);
      if (req.query.category) filter.category = req.query.category;
      if (req.query.buyer)    filter.buyer = req.query.buyer;
      if (req.query.status)   filter.status = req.query.status;
      const data = await Model.find(filter).sort({ createdAt: -1 }).lean();
      res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET one
  router.get(`/${route}/:id`, async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST create
  router.post(`/${route}`, async (req, res) => {
    try {
      const doc = await Model.create(req.body);
      res.status(201).json(doc);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  // PUT update
  router.put(`/${route}/:id`, async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json(doc);
    } catch (err) { res.status(400).json({ error: err.message }); }
  });

  // DELETE
  router.delete(`/${route}/:id`, async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, deleted: doc._id });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });
});

/* ══════════════════════════════════════════
   DASHBOARD KPI AGGREGATION
   ══════════════════════════════════════════ */
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);

    // Inventory stats
    const totalItems    = await Inventory.countDocuments();
    const criticalItems = await Inventory.countDocuments({ status: 'Critical' });
    const riskItems     = await Inventory.countDocuments({ status: 'Risk' });

    // PO stats
    const openOrders      = await PurchaseOrder.countDocuments({ status: { $nin: ['Completed','Cancelled'] } });
    const pendingApprovals= await PurchaseOrder.countDocuments({ status: 'Pending Approval' });
    const emergencyOrders = await PurchaseOrder.countDocuments({ isEmergency: true, status: { $nin: ['Completed','Cancelled'] } });
    const completedOrders = await PurchaseOrder.countDocuments({ status: 'Completed', month });
    const delayedOrders   = await PurchaseOrder.countDocuments({ status: 'Delayed', month });

    // OTD
    const totalDeliveries = await Delivery.countDocuments({ month });
    const onTimeDeliveries= await Delivery.countDocuments({ month, onTime: true });
    const otdRate = totalDeliveries > 0 ? Math.round((onTimeDeliveries / totalDeliveries) * 100 * 10) / 10 : 0;

    // Cost savings
    const savingsAgg = await CostSaving.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: '$savingAmount' } } }
    ]);
    const monthlySavings = savingsAgg[0]?.total || 0;

    const yearlySavingsAgg = await CostSaving.aggregate([
      { $match: { year: parseInt(month.split('-')[0]) } },
      { $group: { _id: null, total: { $sum: '$savingAmount' } } }
    ]);
    const yearlySavings = yearlySavingsAgg[0]?.total || 0;

    // Total spend
    const spendAgg = await PurchaseOrder.aggregate([
      { $match: { month } },
      { $group: { _id: null, total: { $sum: '$totalValue' } } }
    ]);
    const monthlySpend = spendAgg[0]?.total || 0;

    // Supplier compliance
    const avgCompliance = await Supplier.aggregate([
      { $match: { active: true } },
      { $group: { _id: null, avg: { $avg: '$complianceScore' } } }
    ]);
    const complianceRate = Math.round(avgCompliance[0]?.avg || 0);

    res.json({
      totalItems, criticalItems, riskItems,
      openOrders, pendingApprovals, emergencyOrders, completedOrders, delayedOrders,
      otdRate, monthlySavings, yearlySavings, monthlySpend, complianceRate,
      month,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Savings by type for chart ── */
router.get('/dashboard/savings-trend', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await CostSaving.aggregate([
      { $match: { year } },
      { $group: { _id: { month: '$month', type: '$savingType' }, total: { $sum: '$savingAmount' } } },
      { $sort: { '_id.month': 1 } }
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Supplier performance summary ── */
router.get('/dashboard/supplier-performance', async (req, res) => {
  try {
    const suppliers = await Supplier.find({ active: true }).lean();
    const result = suppliers.map(s => ({
      ...s,
      performanceScore: Math.round(((s.otdScore || 0) + (s.qualityScore || 0) + (s.complianceScore || 0)) / 3),
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── Inventory forecasting ── */
router.get('/dashboard/inventory-forecast', async (req, res) => {
  try {
    const items = await Inventory.find().lean();
    const result = [];

    for (const item of items) {
      const history = await Consumption.find({ itemCode: item.itemCode }).sort({ month: 1 }).lean();
      const consumptions = history.map(h => h.consumed || 0);

      // Simple linear forecast
      let nextMonth = 0, monthAfter = 0;
      if (consumptions.length >= 2) {
        const avg = consumptions.reduce((a, b) => a + b, 0) / consumptions.length;
        const trend = (consumptions[consumptions.length - 1] - consumptions[0]) / Math.max(consumptions.length - 1, 1);
        nextMonth = Math.max(0, Math.round(consumptions[consumptions.length - 1] + trend));
        monthAfter = Math.max(0, Math.round(nextMonth + trend));
      } else if (consumptions.length === 1) {
        nextMonth = consumptions[0];
        monthAfter = consumptions[0];
      }

      const coverageDays = nextMonth > 0 ? Math.round((item.currentStock / (nextMonth / 30)) ) : 999;
      const suggestedOrder = Math.max(0, Math.round(item.reorderPoint + (nextMonth * 1.5) - item.currentStock));

      // Status auto-calc
      let calcStatus = 'Healthy';
      if (item.currentStock <= item.safetyStock) calcStatus = 'Critical';
      else if (item.currentStock <= item.reorderPoint) calcStatus = 'Risk';

      result.push({
        ...item, calcStatus,
        consumptionHistory: consumptions,
        forecastNextMonth: nextMonth,
        forecastMonthAfter: monthAfter,
        suggestedOrder,
        coverageDays,
      });
    }

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
