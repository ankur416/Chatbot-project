const mongoose = require("mongoose");
const ChatHistory = require("./models/ChatHistory"); // Ensure this path is correct
const Invoice = require("./models/Invoice"); // Ensure this path is correct

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/chatbotDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

const seedData = async () => {
  try {
    const invoices = [
      {
        name: "Testing A",
        invoiceId: "Ven34562",
        status: "active",
        amount: "70000",
      },
      {
        name: "Testing B",
        invoiceId: "Ven34563",
        status: "deactive",
        amount: "1900",
      },
      {
        name: "Testing C",
        invoiceId: "Ven34564",
        status: "active",
        amount: "10000",
      },
      {
        name: "Testing D",
        invoiceId: "Ven34565",
        status: "deactive",
        amount: "20000",
      },
      {
        name: "Testing E",
        invoiceId: "Ven34566",
        status: "active",
        amount: "30000",
      },
      {
        name: "Testing F",
        invoiceId: "Ven34567",
        status: "active",
        amount: "60000",
      },
    ];

    await Invoice.insertMany(invoices);
    console.log("Invoice data inserted successfully.");

    mongoose.connection.close(); // Close connection after insertion
  } catch (error) {
    console.error("Error inserting invoice data:", error);
    mongoose.connection.close(); // Ensure connection is closed on error
  }
};

seedData();
