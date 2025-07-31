// seedData.js
const mongoose = require("mongoose");
const Vendor = require("./models/Vendor"); // Ensure correct model import

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatbotDB")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const seedData = async () => {
  try {
    const vendors = [
      {
        name: "Testing A",
        vendorId: "V001",
        registrationStatus: "active",
        amount: 70000,
        performanceRating: "5 star *****",
        profileHelp: "Support available for vendors A",
      },
      {
        name: "Testing B",
        vendorId: "V002",
        registrationStatus: "deactive",
        amount: 1900,
        performanceRating: "4 star ****",
        profileHelp: "Support available for vendors B",
      },
      {
        name: "Testing C",
        vendorId: "V003",
        registrationStatus: "active",
        amount: 10000,
        performanceRating: "5 star *****",
        profileHelp: "Support available for vendors C",
      },
      {
        name: "Testing D",
        vendorId: "V004",
        registrationStatus: "deactive",
        amount: 20000,
        performanceRating: "5 star *****",
        profileHelp: "Support available for vendors D",
      },
      {
        name: "Testing E",
        vendorId: "V005",
        registrationStatus: "active",
        amount: 30000,
        performanceRating: "5 star *****",
        profileHelp: "Support available for vendors E",
      },
      {
        name: "Testing F",
        vendorId: "V006",
        registrationStatus: "active",
        amount: 60000,
        performanceRating: "5 star *****",
        profileHelp: "Support available for vendors F",
      },
    ];

    await Vendor.insertMany(vendors);
    console.log("Vendor data inserted successfully.");

    mongoose.connection.close(); // Close the connection after inserting
  } catch (error) {
    console.error("Error inserting vendor data:", error);
    mongoose.connection.close(); // Ensure connection is closed on error
  }
};

seedData();
