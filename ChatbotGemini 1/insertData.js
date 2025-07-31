const mongoose = require("mongoose");
const ChatHistory = require("./models/ChatHistory"); // Ensure this path is correct
const FAQ = require('./models/FAQ');
// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chatbotDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const seedData = async () => {
  const faq = [
    {
      question: "How to changes profile details?",
      answer: "Log in, go to Profile Settings, update details, save changes, and contact support if needed."
    },
    

  ];
  
  await FAQ.insertMany(faq);
  console.log("FAQ data inserted.");
};

seedData();
