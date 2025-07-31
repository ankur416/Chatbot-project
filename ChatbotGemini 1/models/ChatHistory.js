   // models/ChatHistory.js
   const mongoose = require('mongoose');

   const chatSchema = new mongoose.Schema(
     {
       sender: {
         type: String,
         required: true,
       },
       text: {
         type: String,
         required: true,
       },
       timestamp: {
         type: Date,
         default: Date.now,
       },
     },
     { timestamps: true }
   );
   
   const ChatHistory = mongoose.model('ChatHistory', chatSchema);
   
   module.exports = ChatHistory;