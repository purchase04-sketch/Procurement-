const { Inventory, Consumption, Supplier, SupplierPrice, SOB, LeadDays, SafetyStock, Performance } = require('../models');

/**
 * Calculates Inventory Planning for a given month
 */
async function calculateInventoryPlanning(itemCode, month) {
  // Get base item data
  const item = await Inventory.findOne({ itemCode });
  if (!item) return null;

  // Get consumption history for same month last year (simplified)
  const lastYearMonth = (parseInt(month.split('-')[0]) - 1) + '-' + month.split('-')[1];
  const lastYearConsumption = await Consumption.findOne({ itemCode, month: lastYearMonth });

  // Get master data mappings
  const prices = await SupplierPrice.find({ itemCode });
  const sobs = await SOB.find({ itemCode });
  const leadDays = await LeadDays.find({ itemCode });
  const safety = await SafetyStock.findOne({ itemCode });

  const forecastQty = lastYearConsumption ? lastYearConsumption.consumed : 0;
  const currentStock = item.currentStock || 0;
  const safetyStock = safety ? safety.safetyStock : 0;
  
  // Net requirement = Forecast + Safety Stock - Current Stock
  const netRequirement = Math.max(0, forecastQty + safetyStock - currentStock);
  const suggestedOrderQty = netRequirement; // Simplified

  // Allocation per supplier
  const allocations = sobs.map(sob => {
    const priceObj = prices.find(p => p.supplierCode === sob.supplierCode);
    const leadObj = leadDays.find(l => l.supplierCode === sob.supplierCode);
    return {
      supplierCode: sob.supplierCode,
      percentage: sob.percentage,
      allocatedQty: (suggestedOrderQty * sob.percentage) / 100,
      rate: priceObj ? priceObj.price : 0,
      value: (suggestedOrderQty * sob.percentage / 100) * (priceObj ? priceObj.price : 0),
      leadDays: leadObj ? leadObj.leadDays : 0
    };
  });

  return {
    itemCode,
    itemName: item.itemName,
    forecastQty,
    currentStock,
    safetyStock,
    netRequirement,
    suggestedOrderQty,
    allocations
  };
}

/**
 * Calculates Risk Status
 */
async function calculateRisk(itemData, supplierPerformance) {
  let score = 0;
  
  // Factors
  if (itemData.currentStock < itemData.safetyStock) score += 40;
  if (!itemData.allocations || itemData.allocations.length === 0) score += 30;
  if (itemData.allocations && itemData.allocations.some(a => a.percentage >= 80)) score += 20; // Single supplier dependency
  
  // Lead days risk
  if (itemData.allocations && itemData.allocations.some(a => a.leadDays > 30)) score += 10;

  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Master recalculation
 */
async function recalculateAll(month) {
  // Logic to refresh all tables based on new uploads
  console.log(`Recalculating for ${month}...`);
  // This would typically iterate through items and update a 'Planning' collection or similar
}

module.exports = {
  calculateInventoryPlanning,
  calculateRisk,
  recalculateAll
};
