const mongoose = require('mongoose');

/* ── Inventory Master ── */
const inventorySchema = new mongoose.Schema({
  itemCode:     { type: String, required: true, unique: true },
  itemName:     { type: String, required: true },
  category:     { type: String, default: 'General' },
  unit:         { type: String, default: 'Units' },
  currentStock: { type: Number, default: 0 },
  safetyStock:  { type: Number, default: 0 },
  reorderPoint: { type: Number, default: 0 },
  leadTimeDays: { type: Number, default: 7 },
  unitPrice:    { type: Number, default: 0 },
  status:       { type: String, enum: ['Healthy','Risk','Critical'], default: 'Healthy' },
  abcClass:     { type: String, enum: ['A','B','C'], default: 'C' },
  xyzClass:     { type: String, enum: ['X','Y','Z'], default: 'Z' },
}, { timestamps: true });

/* ── Monthly Consumption (one doc per item per month) ── */
const consumptionSchema = new mongoose.Schema({
  itemCode:    { type: String, required: true },
  month:       { type: String, required: true },       // "2026-05"
  year:        { type: Number, required: true },
  consumed:    { type: Number, default: 0 },
  forecast:    { type: Number, default: 0 },
  openingStock:{ type: Number, default: 0 },
  closingStock:{ type: Number, default: 0 },
  received:    { type: Number, default: 0 },
}, { timestamps: true });
consumptionSchema.index({ itemCode: 1, month: 1 }, { unique: true });

/* ── Supplier Master ── */
const supplierSchema = new mongoose.Schema({
  supplierCode: { type: String, required: true, unique: true },
  supplierName: { type: String, required: true },
  category:     { type: String, default: 'General' },
  contactPerson:{ type: String, default: '' },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  leadTimeDays: { type: Number, default: 7 },
  paymentTerms: { type: String, default: 'Net 30' },
  riskLevel:    { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  complianceScore: { type: Number, default: 0 },
  qualityScore:    { type: Number, default: 0 },
  otdScore:        { type: Number, default: 0 },
  active:          { type: Boolean, default: true },
}, { timestamps: true });

/* ── Purchase Orders ── */
const purchaseOrderSchema = new mongoose.Schema({
  poNumber:      { type: String, required: true, unique: true },
  prNumber:      { type: String, default: '' },
  itemCode:      { type: String, required: true },
  itemName:      { type: String, default: '' },
  supplierCode:  { type: String, required: true },
  supplierName:  { type: String, default: '' },
  buyer:         { type: String, default: '' },
  quantity:      { type: Number, default: 0 },
  unitPrice:     { type: Number, default: 0 },
  totalValue:    { type: Number, default: 0 },
  orderDate:     { type: Date },
  expectedDelivery: { type: Date },
  actualDelivery:   { type: Date },
  status:        { type: String, enum: ['Draft','Pending Approval','Approved','In Transit','Completed','Delayed','Cancelled'], default: 'Draft' },
  delayDays:     { type: Number, default: 0 },
  month:         { type: String, default: '' },
  isEmergency:   { type: Boolean, default: false },
}, { timestamps: true });

/* ── Cost Savings ── */
const costSavingSchema = new mongoose.Schema({
  savingId:     { type: String, required: true, unique: true },
  month:        { type: String, required: true },
  year:         { type: Number, required: true },
  category:     { type: String, default: 'General' },
  savingType:   { type: String, enum: ['Negotiation','PPV','Localization','Alternate Supplier','Process Improvement','Other'], default: 'Other' },
  itemCode:     { type: String, default: '' },
  itemName:     { type: String, default: '' },
  supplierCode: { type: String, default: '' },
  supplierName: { type: String, default: '' },
  buyer:        { type: String, default: '' },
  previousRate: { type: Number, default: 0 },
  newRate:      { type: Number, default: 0 },
  quantity:     { type: Number, default: 0 },
  savingAmount: { type: Number, default: 0 },
  annualizedSaving: { type: Number, default: 0 },
  description:  { type: String, default: '' },
}, { timestamps: true });

/* ── Supplier Delivery / OTD Records ── */
const deliverySchema = new mongoose.Schema({
  deliveryId:    { type: String, required: true, unique: true },
  poNumber:      { type: String, required: true },
  supplierCode:  { type: String, required: true },
  supplierName:  { type: String, default: '' },
  expectedDate:  { type: Date },
  actualDate:    { type: Date },
  onTime:        { type: Boolean, default: true },
  delayDays:     { type: Number, default: 0 },
  quantity:      { type: Number, default: 0 },
  rejectedQty:   { type: Number, default: 0 },
  qualityStatus: { type: String, enum: ['Accepted','Partially Accepted','Rejected'], default: 'Accepted' },
  remarks:       { type: String, default: '' },
  month:         { type: String, default: '' },
}, { timestamps: true });

/* ── Miscellaneous Activities ── */
const activitySchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  status:      { type: String, enum: ['Pending','In Progress','Completed','Cancelled'], default: 'Pending' },
  priority:    { type: String, enum: ['Low','Medium','High','Critical'], default: 'Medium' },
  assignedTo:  { type: String, default: '' },
  dueDate:     { type: Date },
  month:       { type: String, default: '' },
}, { timestamps: true });

module.exports = {
  Inventory:     mongoose.model('Inventory', inventorySchema),
  Consumption:   mongoose.model('Consumption', consumptionSchema),
  Supplier:      mongoose.model('Supplier', supplierSchema),
  PurchaseOrder: mongoose.model('PurchaseOrder', purchaseOrderSchema),
  CostSaving:    mongoose.model('CostSaving', costSavingSchema),
  Delivery:      mongoose.model('Delivery', deliverySchema),
  Activity:      mongoose.model('Activity', activitySchema),
};
