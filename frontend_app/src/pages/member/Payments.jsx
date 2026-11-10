import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptModal from '../../components/ReceiptModal';
import api from '../../api/axios';

export default function Payments() {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes, recRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices'),
        api.get('/receipts'),
      ]);
      setPayments(payRes.data.data || payRes.data || []);
      setInvoices(invRes.data.data || invRes.data || []);
      setReceipts(recRes.data.data || recRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f172a">
          Billing, Payments & Receipts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review your subscription payment transactions, generated invoices, and official computer-generated receipts.
        </Typography>
      </Box>

      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} indicatorColor="primary" textColor="primary">
          <Tab label={`Official Receipts (${receipts.length})`} />
          <Tab label={`Invoices (${invoices.length})`} />
          <Tab label={`Payment Transactions (${payments.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: RECEIPTS */}
      {tab === 0 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Official Subscription Receipts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Issued upon verified payment confirmation for active gym memberships.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Receipt #</strong></TableCell>
                    <TableCell><strong>Payment Date</strong></TableCell>
                    <TableCell><strong>Payment Method</strong></TableCell>
                    <TableCell align="right"><strong>Amount Paid</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No receipts generated yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    receipts.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {r.receipt_number}
                        </TableCell>
                        <TableCell>{new Date(r.payment_date || r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{r.payment_method}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ${parseFloat(r.amount_paid).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip label="CONFIRMED" size="small" color="success" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ReceiptIcon />}
                            onClick={() => handleOpenReceipt(r)}
                          >
                            View & Print
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 1: INVOICES */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Issued Invoices
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Invoices generated for membership subscriptions and service fees.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Invoice #</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Issue Date</strong></TableCell>
                    <TableCell><strong>Due Date</strong></TableCell>
                    <TableCell align="right"><strong>Total Amount</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No invoices on record.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                        <TableCell>{inv.description}</TableCell>
                        <TableCell>{inv.issue_date}</TableCell>
                        <TableCell>{inv.due_date}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ${parseFloat(inv.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(inv.status || 'PAID').toUpperCase()}
                            size="small"
                            color={inv.status === 'paid' ? 'success' : 'warning'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: PAYMENTS */}
      {tab === 2 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Payment Audit History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Traceable logs of simulated payment transactions.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Reference Code</strong></TableCell>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No payment transactions recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {p.payment_reference}
                        </TableCell>
                        <TableCell>{(p.payable_type || 'membership').toUpperCase()}</TableCell>
                        <TableCell>{p.payment_method}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          ${parseFloat(p.amount).toFixed(2)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(p.status || 'completed').toUpperCase()}
                            size="small"
                            color="success"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        receipt={selectedReceipt}
      />
    </Box>
  );
}
