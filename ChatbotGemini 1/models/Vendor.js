const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    match: /^V\d{3}$/
  },
  name: {
    type: String,
    required: true
  },
  registrationStatus: {
    type: String,
    enum: ["active", "pending", "suspended", "rejected"],
    default: "pending"
  },
  performanceRating: {
    type: String,
    default: "Not rated"
  },
  profileHelp: {
    type: String,
    default: "Contact support for assistance"
  }
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', vendorSchema);

module.exports = Vendor;