const mongoose = require("mongoose");
const ChatHistory = require("./models/ChatHistory");
const PO = require("./models/PO"); // Ensure this path is correct

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chatbotDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  const purchaseOrders = [
    {
      status: "Approved",
      pendingQuantity: "150 units",
      purchaseRequisition: "Requisition ID: 1",
    },
    {
      status: "Pending",
      pendingQuantity: "200 units",
      purchaseRequisition: "Requisition ID: 2",
    },
    {
      status: "Rejected",
      pendingQuantity: "50 units",
      purchaseRequisition: "Requisition ID: 3",
    },
  ];

  await PO.insertMany(purchaseOrders);
  console.log("Purchase Order data inserted.");
  mongoose.connection.close(); // Close the connection after inserting
};

seedData().catch((err) => console.log(err));
