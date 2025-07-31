import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { 
  TextField, 
  Button, 
  Paper, 
  Box, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableContainer
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import axios from "axios";
import QuickActions from "./QuickActions";
import logo from "./assets/orane-logo.png";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [actionType, setActionType] = useState('default');
  const containerRef = useRef(null);
  const prevScrollHeight = useRef(0);

  const [poDetails, setPoDetails] = useState({
    status: "Approved",
    pendingQuantity: "150 units",
    purchaseRequisition: "Requisition ID: 1"
  });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    prevScrollHeight.current = containerRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/chat/history");
        if (response.data.length === 0) {
          const welcomeMessage = { 
            sender: "bot", 
            text: "👋 Welcome to Orane's Vendor Portal! How can I help you today? Please choose an option below:" 
          };
          setMessages([welcomeMessage]);
          setShowQuickActions(true);
          setActionType('default');
        } else {
          setMessages(response.data);
          setShowQuickActions(false);
        }
      } catch (error) {
        console.error("Error fetching chat history:", error);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      if (lastMessage.text?.includes("Please choose an option below")) {
        setActionType('default');
        setShowQuickActions(true);
      }
      else if (lastMessage.text?.includes("Select vendor detail")) {
        setActionType('vendorRegistration');
        setShowQuickActions(true);
      }
      else if (lastMessage.text?.includes("PO-related information")) {
        setActionType('po');
        setShowQuickActions(true);
      }
      else if (lastMessage.text?.includes("Do you want to continue")) {
        setActionType('continuation');
        setShowQuickActions(true);
      }
      else if (lastMessage.text?.includes("Have I resolved your query")) {
        setActionType('resolution');
        setShowQuickActions(true);
      }
      else if (lastMessage.text?.includes("RFQ-related option")) {
        setActionType('rfq');
        setShowQuickActions(true);
      }
      else {
        setShowQuickActions(false);
      }
    }
  }, [messages]);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;

  const handleMicClick = () => {
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    setInput(transcript);
  };

  const sendMessage = async (messageText) => {
    const text = messageText !== undefined ? messageText : input;
    if (!text.trim()) return;

    if (text.toLowerCase() === "new chat") {
      setMessages([]);
      const welcomeMessage = { 
        sender: "bot", 
        text: "👋 Welcome to Orane's Vendor Portal! How can I help you today? Please choose an option below:" 
      };
      setMessages([welcomeMessage]);
      setShowQuickActions(true);
      setActionType('default');
      return;
    }

    const userMessage = { sender: "user", text: text };
    setMessages((prev) => [...prev, userMessage]);
    setShowQuickActions(false);

    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }

    setIsTyping(true);

    try {
      let replies = [];

      if (text.toLowerCase() === "vendor registration") {
        const reply = "Please enter your Vendor ID (format: V001, V002, etc.)";
        setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
        return;
      }

      const poResponses = {
        "PO Status": `Current PO Status: ${poDetails.status}`,
        "Pending Quantity": `Pending Quantity: ${poDetails.pendingQuantity}`,
        "Purchase Requisition": `Requisition ID: ${poDetails.purchaseRequisition}`
      };

      if (poResponses[text]) {
        replies = [poResponses[text]];
      }

      if (replies.length === 0) {
        const res = await axios.post("http://localhost:8000/api/chat", { message: text });
        replies = res.data.replies || [res.data.reply];
      }

      for (const replyText of replies) {
        const botMessage = { 
          sender: "bot", 
          text: replyText,
          ...(isInvoiceMessage(replyText) && { invoiceData: parseInvoice(replyText) })
        };
        setMessages((prev) => [...prev, botMessage]);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch {
      const errorMessage = { sender: "bot", text: "Error, try again." };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsTyping(false);
    if (messageText === undefined) setInput("");
  };

  const parseInvoice = (text) => {
    const lines = text.split('\n');
    const invoiceData = {};
  
    lines.forEach(line => {
      if (line.startsWith('* ID')) invoiceData.id = line.split(':')[1].trim();
      if (line.startsWith('* Name')) invoiceData.name = line.split(':')[1].trim();
      if (line.startsWith('* Status')) invoiceData.status = line.split(':')[1].trim();
      if (line.startsWith('* Amount')) invoiceData.amount = line.split(':')[1].trim();
      if (line.startsWith('* Due Date')) invoiceData.dueDate = line.split(':')[1].trim();
    });
  
    return Object.keys(invoiceData).length > 0 ? invoiceData : null;
  };

  const isInvoiceMessage = (text) => text.includes("Invoice Details");

  const renderInvoiceTable = (invoiceData) => (
    <TableContainer component={Box}>
      <Table sx={{ minWidth: 250 }} aria-label="invoice table">
        <TableBody>
          <TableRow>
            <TableCell sx={{ border: 'none', fontWeight: 'bold', py: 1 }}>ID</TableCell>
            <TableCell sx={{ border: 'none', py: 1 }}>{invoiceData.id}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none', fontWeight: 'bold', py: 1 }}>Name</TableCell>
            <TableCell sx={{ border: 'none', py: 1 }}>{invoiceData.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none', fontWeight: 'bold', py: 1 }}>Status</TableCell>
            <TableCell sx={{ border: 'none', py: 1 }}>{invoiceData.status}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none', fontWeight: 'bold', py: 1 }}>Amount</TableCell>
            <TableCell sx={{ border: 'none', py: 1 }}>{invoiceData.amount}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ border: 'none', fontWeight: 'bold', py: 1 }}>Due Date</TableCell>
            <TableCell sx={{ border: 'none', py: 1 }}>{invoiceData.dueDate || "N/A"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        p: 0,
        maxWidth: 400,
        mx: "auto",
        mt: 4,
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "2px solid #f0f0f0",
        borderRadius: "12px",
        background: "linear-gradient(145deg, #ffffff, #f8f8f8)",
      }}
    >
      <Box
        sx={{
          bgcolor: "#6A1B9A",
          color: "white",
          p: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          borderBottom: "2px solid #4A148C",
        }}
      >
        <img
          src={logo}
          alt="Orane Consulting"
          style={{ width: "40px", height: "40px", borderRadius: "8px" }}
        />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Orane Consulting Assistant
        </Typography>
      </Box>

      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: 'relative',
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: msg.sender === "user" ? "#6A1B9A" : "#ECEFF1",
              color: msg.sender === "user" ? "white" : "#263238",
              maxWidth: "85%",
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              wordBreak: "break-word",
              boxShadow: 1,
            }}
          >
            {msg.invoiceData ? (
              <>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  📄 Invoice Details: {msg.invoiceData.id}
                </Typography>
                {renderInvoiceTable(msg.invoiceData)}
              </>
            ) : (
              <Typography variant="body1" sx={{ lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
            )}
          </Box>
        ))}
        {isTyping && (
          <Box
            sx={{
              p: 2,
              borderRadius: "12px",
              bgcolor: "#ECEFF1",
              color: "#263238",
              maxWidth: "85%",
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </Box>
        )}
        {showQuickActions && (
          <QuickActions 
            onActionClick={sendMessage} 
            actionType={actionType} 
            sx={{ mt: 'auto' }} 
          />
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: "2px solid #f0f0f0",
          background: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 1,
            "& > *": {
              height: "56px",
            },
          }}
        >
          <Box sx={{ flexGrow: 1, position: "relative" }}>
            <TextField
              fullWidth
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  "& fieldset": {
                    borderColor: "#E0E0E0",
                  },
                  "&:hover fieldset": {
                    borderColor: "#BDBDBD",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6A1B9A",
                  },
                },
              }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={() => sendMessage()}
            sx={{
              minWidth: 80,
              bgcolor: "#6A1B9A",
              "&:hover": { bgcolor: "#4A148C" },
              borderRadius: "8px",
              textTransform: "none",
            }}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            onClick={handleMicClick}
            sx={{
              minWidth: 56,
              borderColor: "#E0E0E0",
              "&:hover": {
                borderColor: "#BDBDBD",
                bgcolor: "rgba(106, 27, 154, 0.04)",
              },
              borderRadius: "8px",
            }}
          >
            <MicIcon sx={{ color: "#6A1B9A" }} />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default Chatbot;