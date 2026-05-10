const nodemailer = require('nodemailer');

/**
 * Configure transporter (Example - would need real credentials in .env)
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Generates email HTML for pending items
 */
function generatePendingItemsEmail(supplierName, items) {
  const rows = items.map(item => `
    <tr>
      <td>${item.itemCode}</td>
      <td>${item.itemName}</td>
      <td>${item.pendingQty}</td>
      <td>${new Date(item.requiredDate).toLocaleDateString()}</td>
    </tr>
  `).join('');

  return `
    <h2>Pending Supply Reminder - ${supplierName}</h2>
    <p>Dear Supplier, the following items are pending for delivery:</p>
    <table border="1" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th>Item Code</th>
          <th>Item Name</th>
          <th>Pending Qty</th>
          <th>Required Date</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    <p>Please update dispatch status immediately.</p>
  `;
}

/**
 * Sends mail to supplier
 */
async function sendSupplierReminder(to, supplierName, items) {
  const html = generatePendingItemsEmail(supplierName, items);
  
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured. Previewing mail content:');
    console.log(html);
    return { success: true, preview: html };
  }

  const info = await transporter.sendMail({
    from: '"Procurement System" <noreply@procurement.com>',
    to: to,
    subject: `Urgent: Pending Supply Reminder - ${supplierName}`,
    html: html,
  });

  return { success: true, messageId: info.messageId };
}

module.exports = {
  generatePendingItemsEmail,
  sendSupplierReminder
};
