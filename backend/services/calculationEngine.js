const { Inventory, Consumption, Supplier, SupplierPrice, SOB, LeadDays, SafetyStock, Performance } = require('../models');

/**
 * Calculates Inventory Planning for a given item and month.
 * Planning is based on FY 25-26 schedule/consumption data.
 * Month format: "2026-04" (FY 26-27)
 * Last year equivalent: "2025-04" (FY 25-26)
 */
async function calculateInventoryPlanning(itemCode, month) {
  const item = await Inventory.findOne({ itemCode });
  if (!item) return null;

  // Map FY 26-27 month → same month in FY 25-26
  const [yyyy, mm] = month.split('-');
  const lyYear = parseInt(yyyy) - 1;
  const lastYearMonth = `${lyYear}-${mm}`;

  // Get last year consumption (same month)
  const lyConsumptionDoc = await Consumption.findOne({ itemCode, month: lastYearMonth });
  const lyConsumption = lyConsumptionDoc ? lyConsumptionDoc.consumed : 0;

  // Get master data
  const prices = await SupplierPrice.find({ itemCode });
  const sobs = await SOB.find({ itemCode });
  const leadDaysData = await LeadDays.find({ itemCode });
  const safety = await SafetyStock.findOne({ itemCode });

  const forecastQty = lyConsumption; // Forecast = last year same month
  const currentStock = item.currentStock || 0;
  const safetyStock = safety ? safety.safetyStock : (item.safetyStock || 0);
  const leadTime = item.leadTimeDays || 7;
  const riskFactor = 1; // default, editable by user

  // Net requirement = Forecast + Safety Stock - Current Stock
  const netRequirement = Math.max(0, Math.round(forecastQty * riskFactor + safetyStock - currentStock));
  const suggestedOrderQty = netRequirement;

  // Supplier-wise allocation
  const allocations = sobs.map(sob => {
    const priceObj = prices.find(p => p.supplierCode === sob.supplierCode);
    const leadObj = leadDaysData.find(l => l.supplierCode === sob.supplierCode);
    const allocatedQty = Math.round((suggestedOrderQty * sob.percentage) / 100);
    const rate = priceObj ? priceObj.price : 0;
    return {
      supplierCode: sob.supplierCode,
      percentage: sob.percentage,
      allocatedQty,
      rate,
      value: allocatedQty * rate,
      leadDays: leadObj ? leadObj.leadDays : leadTime
    };
  });

  // If no SOB data but item has a price, create a single 100% allocation
  if (allocations.length === 0 && item.unitPrice > 0) {
    allocations.push({
      supplierCode: '—',
      percentage: 100,
      allocatedQty: suggestedOrderQty,
      rate: item.unitPrice,
      value: suggestedOrderQty * item.unitPrice,
      leadDays: leadTime
    });
  }

  // Recommendation
  let recommendation = 'Proceed as planned';
  if (netRequirement === 0) recommendation = 'No order needed';
  if (currentStock < safetyStock) recommendation = 'Urgent reorder required';

  return {
    _id: item._id,
    itemCode,
    itemName: item.itemName,
    commodity: item.category,
    lyConsumption,
    lyScheduleQty: lyConsumption, // using consumption as schedule proxy
    forecastQty,
    currentStock,
    safetyStock,
    leadTime,
    riskFactor,
    netRequirement,
    suggestedOrderQty,
    allocations,
    recommendation
  };
}

/**
 * Multi-factor risk scoring
 */
async function calculateRisk(itemData) {
  let score = 0;

  // Stock below safety
  if (itemData.currentStock < itemData.safetyStock) score += 35;
  // No supplier allocation
  if (!itemData.allocations || itemData.allocations.length === 0) score += 25;
  // Single supplier dependency (one supplier >= 80%)
  if (itemData.allocations && itemData.allocations.some(a => a.percentage >= 80)) score += 15;
  // Long lead time
  if (itemData.allocations && itemData.allocations.some(a => a.leadDays > 30)) score += 10;
  // Missing price
  if (itemData.allocations && itemData.allocations.some(a => a.rate === 0)) score += 10;
  // High consumption with low stock
  if (itemData.forecastQty > 0 && itemData.currentStock < itemData.forecastQty * 0.5) score += 5;

  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

/**
 * Master recalculation triggered on re-upload
 */
async function recalculateAll(month) {
  console.log(`♻️ Recalculating all planning for ${month}...`);
}

module.exports = {
  calculateInventoryPlanning,
  calculateRisk,
  recalculateAll
};
