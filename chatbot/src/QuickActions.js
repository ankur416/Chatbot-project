import React from "react";
import { Button, Box, Grid } from "@mui/material";
import {
  AssignmentInd,
  Receipt,
  RequestQuote,
  LocalShipping,
  ContactSupport,
  Assignment,
  ShoppingCart,
  CheckCircle,
  Cancel,
  ArrowForward,
  Chat,
  Star,
  Person,
  HourglassEmpty,
  Pending,
  Description,
  Help,
  Update,
  ShortText,
  Payment
} from "@mui/icons-material";

const quickActions = [
  { label: "Vendor Registration", message: "Vendor Registration" },
  { label: "Invoice", message: "Check invoice status" },
  { label: "RFQ", message: "RFQ" },
  { label: "ASN", message: "ASN" },
  { label: "Contact Support", message: "Contact Support" },
  { label: "GRN", message: "what is GRN?" },
  { label: "PO", message: "PO" },
];

const vendorRegistrationActions = [
  { label: "Registration Status", message: "registration status" },
  { label: "Performance Rating", message: "performance rating" },
  { label: "Profile Details", message: "profile details" },
];

const poActions = [
  { label: "PO Status", message: "PO Status" },
  { label: "Pending Quantity", message: "Pending Quantity" },
  { label: "Purchase Requisition", message: "Purchase Requisition" },
];

const rfqActions = [
  { label: "What is RFQ", message: "What is RFQ?" },
  { label: "Status of submitted bid", message: "Bid status" },
  { label: "Has my bid been shortlisted", message: "Bid shortlist status" },
  { label: "Payment terms", message: "RFQ payment terms" },
];

const resolutionActions = [
  { label: "Yes", message: "Yes" },
  { label: "No", message: "No" },
];

const continuationActions = [
  { label: "Yes, Continue", message: "Yes, Continue" },
  { label: "New Chat", message: "New Chat" },
];

const getActionIcon = (label) => {
  const iconMap = {
    "Vendor Registration": <AssignmentInd fontSize="small" />,
    "Invoice": <Receipt fontSize="small" />,
    "RFQ": <RequestQuote fontSize="small" />,
    "ASN": <LocalShipping fontSize="small" />,
    "Contact Support": <ContactSupport fontSize="small" />,
    "GRN": <Assignment fontSize="small" />,
    "PO": <ShoppingCart fontSize="small" />,
    "Registration Status": <HourglassEmpty fontSize="small" />,
    "Performance Rating": <Star fontSize="small" />,
    "Profile Details": <Person fontSize="small" />,
    "PO Status": <HourglassEmpty fontSize="small" />,
    "Pending Quantity": <Pending fontSize="small" />,
    "Purchase Requisition": <Description fontSize="small" />,
    "What is RFQ": <Help fontSize="small" />,
    "Status of submitted bid": <Update fontSize="small" />,
    "Has my bid been shortlisted": <ShortText fontSize="small" />,
    "Payment terms": <Payment fontSize="small" />,
    "Yes": <CheckCircle fontSize="small" />,
    "No": <Cancel fontSize="small" />,
    "Yes, Continue": <ArrowForward fontSize="small" />,
    "New Chat": <Chat fontSize="small" />,
  };

  return iconMap[label] || <Assignment fontSize="small" />;
};

const QuickActions = ({ onActionClick, actionType, sx }) => {
  const actions = {
    'default': quickActions,
    'rfq': rfqActions,
    'resolution': resolutionActions,
    'continuation': continuationActions,
    'vendorRegistration': vendorRegistrationActions,
    'po': poActions,
  }[actionType] || quickActions;

  const getButtonColor = (action) => {
    if (actionType === 'vendorRegistration') return '#9C27B0';
    if (actionType === 'po') return '#3F51B5';
    if (actionType === 'continuation') 
      return action.label === 'New Chat' ? '#f44336' : '#4CAF50';
    if (actionType === 'resolution') 
      return action.label === 'Yes' ? '#4CAF50' : '#f44336';
    if (actionType === 'rfq') return '#2196F3';
    return '#6A1B9A';
  };

  return (
    <Box
      sx={{
        p: 1,
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        width: '100%',
        ...sx,
      }}
    >
      <Grid container spacing={1}>
        {actions.map((action, index) => (
          <Grid item xs={6} key={index} sx={{ display: 'flex', p: 0.5 }}>
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={getActionIcon(action.label)}
              onClick={() => onActionClick(action.message)}
              sx={{
                textTransform: "none",
                fontSize: "0.7rem",
                borderRadius: "6px",
                py: 0.8,
                px: 1.2,
                minHeight: 32,
                maxWidth: 160,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                justifyContent: 'flex-start',
                backgroundColor: getButtonColor(action),
                '&:hover': {
                  opacity: 0.9,
                  backgroundColor: getButtonColor(action),
                },
              }}
            >
              {action.label}
            </Button>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuickActions;