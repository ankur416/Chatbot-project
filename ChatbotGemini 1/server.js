const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const natural = require("natural");
const stringSimilarity = require("string-similarity");
const ChatHistory = require("./models/ChatHistory");
const Invoice = require("./models/Invoice");
const FAQ = require("./models/FAQ");
const Vendor = require("./models/Vendor");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect("mongodb://127.0.0.1:27017/chatbotDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB Connection Error:", error));

// Helper functions and variables
const tokenizer = new natural.WordTokenizer();

// Expanded intent sets with common variations
const baseGreetings = new Set([
  "hi", "hello", "hey", "hola", "howdy",
  "hlw", "hlo", "helloo", "hii", "heyy",
  "good morning", "good afternoon", "good evening"
]);

const baseFarewells = new Set([
  "bye", "goodbye", "see you", "thanks", "thank you","thankyou",
  "thanx", "thx", "tx", "thanku", "appreciate",
  "cheers", "ciao", "seeya", "later", "peaceout", "welcome"
]);

const baseConfirmations = new Set([
  "ok", "okay", "okk", "alright", "sure", "fine", "nice", "okie", "great", "great work", "wonderful", "go ahead",
  "got it", "roger", "understood", "copy", "okie", "great job"
]);

const baseSorry = new Set([
  "sorry", "sry", "apologize", "apologies", "apologise", "mybad"
]);

const baseNoProblem = new Set([
  "no problem", "noproblem", "np", "noworries", "noworry", 
  "itsok", "itsokay", "donotworry", "dontworry"
]);

const baseTransfers = new Set([
  "agent", "team member", "human", "representative", "support",
  "connect to buyer", "call agent", "talk to someone", "speak with agent",
  "contact support", "live agent", "real person", "transfer me", "connect team",
  "speak to human", "customer service", "phone support", "voice call",
  "direct contact", "live call", "phone agent", "connect on call",
  "talk on phone", "speak directly", "human assistance"
]);

// Enhanced normalization function with typo handling
const normalizeForIntent = (text) => 
  text.toLowerCase()
     .replace(/[^a-z\s]/g, '') // Keep spaces for phrase matching
     .replace(/\s+/g, ' ')     // Collapse multiple spaces
     .replace(/(.)\1{2,}/g, '$1') // Replace 3+ repeated chars with one
     .replace(/(thx|thanx)/g, 'thanks')
     .replace(/(pls|plz)/g, 'please')
     .replace(/(wana|wanna)/g, 'want to')
     .replace(/( u | you )/g, ' you ')
     .replace(/\b(suport|suppor|soport)\b/g, 'support') // Common misspellings
     .trim();

// Create normalized intent sets
const createNormalizedSet = (originalSet) => 
  new Set(Array.from(originalSet).map(normalizeForIntent));

const greetings = createNormalizedSet(baseGreetings);
const farewells = createNormalizedSet(baseFarewells);
const confirmations = createNormalizedSet(baseConfirmations);
const sorrys = createNormalizedSet(baseSorry);
const noProblems = createNormalizedSet(baseNoProblem);
const transfers = createNormalizedSet(baseTransfers);

const invoiceKeywords = new Set([
  "invoice", "status", "track", "check", "payment", "bill",
  "due", "amount", "pay", "balance", "outstanding"
]);

const invoicePhrases = [
  "where is my invoice", "check invoice status", "where is my bill",
  "track my invoice", "outstanding balance"
];

// Transfer-related constants
const TRANSFER_THRESHOLD = 0.65;
const transferPhrases = [
  "contact support", "contact suport", "connect to call", 
  "talk on phone", "speak with buyer", "reach support team",
  "get human assistance", "transfer to call", "connect directly",
  "voice support", "phone agent", "live call", "speak live",
  "connect team member", "contact team", "speak to agent","connect me to buyer"
];

const transferPatterns = [
  /(?:con[tn]ect|contac?t|tr[ae]nsfer|t[oa]lk|spea?k|reach)\s*(?:me|us|to|with)?\s*(?:a|an|the)?\s*(?:buyer|agent|team|suport|support|human|representative|call)/i,
  /(?:get|need|want|request)\s*(?:in\s*)?(?:touch|contact)\s*(?:with)?\s*(?:agent|team|buyer)/i,
  /(?:live\s*support|customer\s*service|real\s*person)/i,
  /escalate\s*(?:to|request|issue)/i,
  /(?:call\s*back|phone\s*assistance|spea?k\s*directly)/i,
  /(?:on\s*phone|voice\s*chat|direct\s*conversation)/i
];

// Extract vendor ID 
function extractVendorId(text) {
  const vendorRegex = /(?:^|\s)(V\d{3})(?:$|\s)/i;
  const match = text.match(vendorRegex);
  return match ? match[1].toUpperCase() : null;
}

// Invoice ID extraction
function extractInvoiceId(text) {
  const venRegex = /ven(\d+)/i;
  const venMatch = text.match(venRegex);
  
  if (venMatch) {
    const digits = venMatch[1];
    const fullId = `VEN${digits.toUpperCase()}`;
    
    if (digits.length !== 5) {
      return { isValid: false, id: fullId, error: "length" };
    }
    return { isValid: true, id: fullId };
  }

  const invalidIdRegex = /([a-zA-Z]+)(\d+)/i;
  const invalidMatch = text.match(invalidIdRegex);
  
  if (invalidMatch) {
    const letters = invalidMatch[1].toUpperCase();
    const numbers = invalidMatch[2];
    return { 
      isValid: false, 
      id: `${letters}${numbers}`, 
      error: "format" 
    };
  }

  return null;
}

// Improved intent detection
function detectIntent(message) {
  const normalized = normalizeForIntent(message);
  console.log(`🔍 Intent Detection - Original: ${message}, Normalized: ${normalized}`);

  if (greetings.has(normalized)) return "greeting";
  if (farewells.has(normalized)) return "farewell";
  if (confirmations.has(normalized)) return "confirmation";
  if (sorrys.has(normalized)) return "sorry";
  if (noProblems.has(normalized)) return "no_problem";
  if (transfers.has(normalized)) return "transfer";
  return "unknown";
}

// Enhanced FAQ matching
async function findBestFAQMatch(message) {
  try {
    const faqs = await FAQ.find({});
    if (faqs.length === 0) return null;

    const questions = faqs.map(f => f.question.toLowerCase());
    const matches = stringSimilarity.findBestMatch(message.toLowerCase(), questions);
    return matches.bestMatch.rating > 0.65 ? faqs[matches.bestMatchIndex] : null;
  } catch (error) {
    console.error("❌ FAQ matching error:", error);
    return null;
  }
}

// Transfer intent detection with typo handling
async function detectTransferIntent(message) {
  try {
    const normalizedMessage = normalizeForIntent(message);
    
    const patternMatch = transferPatterns.some(pattern => 
      pattern.test(normalizedMessage)
    );
    
    const hasTransferWord = normalizedMessage.split(' ').some(word => 
      transfers.has(word)
    );
    
    const matches = stringSimilarity.findBestMatch(normalizedMessage, 
      transferPhrases.map(p => normalizeForIntent(p))
    );
    
    return patternMatch || 
           hasTransferWord || 
           matches.bestMatch.rating > TRANSFER_THRESHOLD;
  } catch (error) {
    console.error("❌ Transfer detection error:", error);
    return false;
  }
}

// Vendor detail handler with switch case
async function handleVendorDetail(cleanMessage, normalizedMessage) {
  const vendorDetailMap = {
    "registration status": "registrationStatus",
    "performance rating": "performanceRating",
    "profile details": "profileHelp",
  };

  const detailField = vendorDetailMap[normalizedMessage];
  if (!detailField) return null;

  const vendorHistory = await ChatHistory.findOne({
    sender: "user",
    text: { $regex: /V\d{3}/i }
  }).sort({ timestamp: -1 });

  if (!vendorHistory) {
    return { replies: ["⚠️ Please provide your Vendor ID first."] };
  }

  const vendorId = extractVendorId(vendorHistory.text);
  const vendor = await Vendor.findOne({ vendorId });

  if (!vendor) {
    return { replies: [`⚠️ Vendor ${vendorId} not found.`] };
  }

  let reply;
  switch (detailField) {
    case "registrationStatus":
      reply = `📋 Registration Status: ${vendor.registrationStatus || 'Not specified'}`;
      break;
    case "performanceRating":
      reply = `⭐ Performance Rating: ${vendor.performanceRating || 'Not rated'}`;
      break;
    case "profileHelp":
      reply = `👤 Profile Assistance: ${vendor.profileHelp || 'Visit portal.orane.in/profile'}`;
      break;
    default:
      reply = "❌ Invalid vendor detail request";
  }

  return { replies: [reply, "Have I resolved your query?"] };
}
function formatInvoiceResponse(invoice) {
  const amount = parseFloat(invoice.amount) || 0;
  const formattedAmount = `₹${amount.toLocaleString('en-IN')}`;
  const dueDate = invoice.dueDate || "N/A";

  const table = `
📄 Invoice Details: ${invoice.invoiceId}
---------------------------------------------
* ID        : ${invoice.invoiceId.padEnd(15)} 
* Name      : ${invoice.name.padEnd(15)}
* Status    : ${invoice.status.padEnd(15)} 
* Amount    : ${formattedAmount.padEnd(15)}
* Due Date  : ${dueDate.padEnd(15)}
---------------------------------------------`;

  return table;
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ reply: "⚠️ No message received. Please try again." });

    console.log(`📩 Received: ${message}`);
    const cleanMessage = message.trim();
    const normalizedMessage = cleanMessage.toLowerCase();

    await ChatHistory.create({ sender: "user", text: cleanMessage });

    const lastBotMessage = await ChatHistory.findOne({ sender: "bot" }).sort({ timestamp: -1 });

    // Vendor ID handling
    const vendorId = extractVendorId(cleanMessage);
    if (vendorId) {
      try {
        const vendor = await Vendor.findOne({ vendorId });
        if (!vendor) {
          const reply = `⚠️ Vendor ${vendorId} not found.`;
          await ChatHistory.create({ sender: "bot", text: reply });
          return res.json({ replies: [reply] });
        }
    
        const reply = "Select vendor detail to view:";
        await ChatHistory.create({ sender: "bot", text: reply });
        return res.json({ replies: [reply] });
      } catch (error) {
        console.error("❌ Vendor error:", error);
        const reply = "⚠️ Error retrieving vendor data.";
        await ChatHistory.create({ sender: "bot", text: reply });
        return res.status(500).json({ replies: [reply] });
      }
    }

    // Handle vendor details
    const vendorDetailResponse = await handleVendorDetail(cleanMessage, normalizedMessage);
    if (vendorDetailResponse) {
      await ChatHistory.create({ sender: "bot", text: vendorDetailResponse.replies[0] });
      if (vendorDetailResponse.replies[1]) {
        await ChatHistory.create({ sender: "bot", text: vendorDetailResponse.replies[1] });
      }
      return res.json(vendorDetailResponse);
    }

    // New chat handler
    if (/\/newchat|new\s+chat/i.test(cleanMessage)) {
      const reply = "👋 Welcome to Orane's Vendor Portal! How can I help you today? Please choose an option below:";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Check if in resolution flow
    if (lastBotMessage && lastBotMessage.text.includes("resolved your query")) {
      const response = cleanMessage.toLowerCase();
      
      if (response.match(/(yes|yeah|yep|sure|yup|ok)/)) {
        const reply = "🎉 Great to hear! Type 'new chat' or '/newchat' to start a new conversation.";
        await ChatHistory.create({ sender: "bot", text: reply });
        return res.json({ replies: [reply] });
      }
      
      if (response.match(/(no|nope|not|nah|negative)/)) {
        const emailReply = "Please drop us a mail at support@orane.in. We will connect with you shortly.";
        await ChatHistory.create({ sender: "bot", text: emailReply });
        
        const continuationReply = "Do you want to continue this chat or want to start a new chat?";
        await ChatHistory.create({ sender: "bot", text: continuationReply });
        
        return res.json({ replies: [emailReply, continuationReply] });
      }
    }

    // Handle continuation choices
    if (cleanMessage.match(/yes,? continue|continue/i)) {
      const reply = "Okay, please tell me how can I help you further. Please choose an option below:";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    if (cleanMessage.match(/new chat|start over/i)) {
      await ChatHistory.deleteMany({});
      const reply = "👋 Welcome to Orane's Vendor Portal! How can I help you today? Please choose an option below:";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Handle RFQ flow
    if (cleanMessage.toLowerCase() === "rfq") {
      const reply = "Please select an RFQ-related option:";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Handle RFQ sub-options
    if (cleanMessage.toLowerCase() === "what is rfq?") {
      const reply = "RFQ (Request for Quotation) is a business process in which a company requests price quotes from suppliers for specific products or services.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    if (cleanMessage.toLowerCase() === "bid status") {
      const reply = "Your bid status is currently under review. We will notify you once a decision has been made.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    if (cleanMessage.toLowerCase() === "bid shortlist status") {
      const reply = "Your bid has been shortlisted. Congratulations! We will contact you soon for the next steps.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    if (cleanMessage.toLowerCase() === "rfq payment terms") {
      const reply = "Our standard payment terms are Net 30 days from the date of invoice. Please contact us for any special arrangements.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Handle basic intents
    const intent = detectIntent(cleanMessage);
    if (intent === "greeting") {
      const reply = "👋 Hello! How can I assist you today? Please choose an option below:";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }
    if (intent === "farewell") {
      const reply = "👋 Goodbye! Type 'new chat' to start a new session later.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }
    if (intent === "confirmation") {
      const reply = "✅ Noted! What else can I help you with?";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }
    if (intent === "sorry") {
      const reply = "🤗 No worries! How can I assist you?";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }
    if (intent === "no_problem") {
      const reply = "😊 Happy to help! What's next?";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }
    if (intent === "transfer") {
      const reply = "🔗 Transferring to a team member... Please stay online.\n\nType 'new chat' to start over.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Enhanced transfer detection with typo handling
    const isTransfer = await detectTransferIntent(cleanMessage);
    if (isTransfer) {
      console.log(`🤖 Transfer Request Detected: ${cleanMessage}`);
      const reply = "🔗 Transferring to a team member... Please stay online.\n\nType 'new chat' to start over.";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Invoice ID handling
    const invoiceIdData = extractInvoiceId(cleanMessage);
    if (invoiceIdData && !vendorId) {
      if (!invoiceIdData.isValid) {
        let reply;
        if (invoiceIdData.error === "length") {
          reply = `⚠️ Incomplete ID (${invoiceIdData.id}). Must be 5 digits.\nExample: Ven12345`;
        } else {
          reply = `⚠️ Invalid format (${invoiceIdData.id}). Use 'Ven' + 5 digits.\nExample: Ven12345`;
        }
        
        await ChatHistory.create({ sender: "bot", text: reply });
        const resolutionReply = "Have I resolved your query?";
        await ChatHistory.create({ sender: "bot", text: resolutionReply });
        
        return res.json({ replies: [reply, resolutionReply] });
      }

      try {
        const invoice = await Invoice.findOne({
          invoiceId: { $regex: new RegExp(`^${invoiceIdData.id}$`, "i") }
        });

        if (invoice) {
          const invoiceReply = formatInvoiceResponse(invoice);
          await ChatHistory.create({ sender: "bot", text: invoiceReply });
          
          const resolutionReply = "Have I resolved your query?";
          await ChatHistory.create({ sender: "bot", text: resolutionReply });
          
          return res.json({ replies: [invoiceReply, resolutionReply] });
        } else {
          const notFoundReply = `⚠️ Invoice ${invoiceIdData.id} not found.`;
          await ChatHistory.create({ sender: "bot", text: notFoundReply });
          
          const resolutionReply = "Have I resolved your query?";
          await ChatHistory.create({ sender: "bot", text: resolutionReply });
          
          return res.json({ replies: [notFoundReply, resolutionReply] });
        }
      } catch (error) {
        console.error("❌ Invoice error:", error);
        const reply = "⚠️ Error retrieving invoice data.";
        await ChatHistory.create({ sender: "bot", text: reply });
        return res.status(500).json({ replies: [reply] });
      }
    }

    // FAQ matching
    const faqMatch = await findBestFAQMatch(cleanMessage);
    if (faqMatch) {
      const reply = faqMatch.answer;
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Invoice context detection
    const tokens = tokenizer.tokenize(cleanMessage.toLowerCase());
    const isInvoiceQuery = invoicePhrases.some(phrase => cleanMessage.toLowerCase().includes(phrase)) ||
                          tokens.some(token => invoiceKeywords.has(token));

    if (isInvoiceQuery) {
      const reply = "📄 Please provide your invoice ID (e.g., Ven12345).";
      await ChatHistory.create({ sender: "bot", text: reply });
      return res.json({ replies: [reply] });
    }

    // Fallback with new chat prompt
    const reply = "👋 Hello! How can I assist you today? Please choose an option below:";
    await ChatHistory.create({ sender: "bot", text: reply });
    return res.json({ replies: [reply] });

  } catch (error) {
    console.error("❌ Server Error:", error);
    res.status(500).json({ replies: ["⚠️ Error processing request."] });
  }
});

// History endpoint
app.get("/api/chat/history", async (req, res) => {
  try {
    const history = await ChatHistory.find().sort({ timestamp: 1 });
    res.json(history);
  } catch (error) {
    console.error("❌ History error:", error);
    res.status(500).json({ error: "⚠️ Unable to retrieve history." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});