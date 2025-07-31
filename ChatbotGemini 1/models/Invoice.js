// models/FAQ.js
const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  invoiceId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
