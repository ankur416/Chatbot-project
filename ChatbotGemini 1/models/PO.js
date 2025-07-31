// models/PO.js
const mongoose = require('mongoose');

const poSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  pendingQuantity: {
    type: String,
    required: true,
  },
  purchaseRequisition: {
    type: String,
    required: true,
  },
});

const PO = mongoose.model('PO', poSchema);

module.exports = PO;
