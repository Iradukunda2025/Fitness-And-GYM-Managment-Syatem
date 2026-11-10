import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import StatCard from '../../components/StatCard';
import ReceiptModal from '../../components/ReceiptModal';
import api from '../../api/axios';

export default function Financials() {
  const [tab, setTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulation Modal
  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simData, setSimData] = useState({
    payable_type: 'one_time_service',
    amount: 35,
    payment_method: 'card',
    description: 'Personal Training Session / Gym Day Pass',
    simulate_status: 'completed',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [payRes, invRes, recRes, sumRes] = await Promise.allSettled([
        api.get('/payments'),
        api.get('/invoices'),
        api.get('/receipts'),
        api.get('/payments/revenue-summary'),
      ]);

      if (payRes.status === 'fulfilled') setPayments(payRes.value.data.data || payRes.value.data || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.data || invRes.value.data || []);
      if (recRes.status === 'fulfilled') setReceipts(recRes.value.data.data || recRes.value.data || []);
      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/payments/simulate', simData);
      setFeedback({ type: 'success', text: res.data.message || 'Payment simulation completed successfully!' });
      setSimulateOpen(false);
      fetchFinancialData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Simulation failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setReceiptOpen(true);
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Financial Management & Revenue Ledger
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Traceable financial transactions, invoice billing, official receipt generation, and simulated payment gateways.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<PaymentIcon />}
          onClick={() => setSimulateOpen(true)}
        >
          Simulate Payment Transaction
        </Button>
      </Box>

      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setFeedback({ type: '', text: '' })}
        >
          {feedback.text}
        </Alert>
      )}

      {/* KPI Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue Collected"
            value={`$${parseFloat(summary?.total_revenue || 0).toLocaleString()}`}
            subtitle="Verified completed transactions"
            icon={<AttachMoneyIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="This Month's Revenue"
            value={`$${parseFloat(summary?.this_month_revenue || 0).toLocaleString()}`}
            subtitle="Current calendar month"
            icon={<PaymentIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Issued Receipts"
            value={receipts.length}
            subtitle="Computer-generated receipts"
            icon={<ReceiptIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Generated Invoices"
            value={invoices.length}
            subtitle="Billing documents"
            icon={<AttachMoneyIcon />}
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} indicatorColor="primary" textColor="primary">
          <Tab label={`Payment Transactions (${payments.length})`} />
          <Tab label={`Official Receipts (${receipts.length})`} />
          <Tab label={`Invoices (${invoices.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: PAYMENTS */}
      {tab === 0 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Reference Code</strong></TableCell>
                    <TableCell><strong>Member</strong></TableCell>
                    <TableCell><strong>Item / Purpose</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell align="right"><strong>Amount</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {p.payment_reference}
                      </TableCell>
                      <TableCell>{p.user?.name || 'Customer'}</TableCell>
                      <TableCell>{(p.payable_type || 'service').toUpperCase()}</TableCell>
                      <TableCell>{p.payment_method}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ${parseFloat(p.amount).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p.status.toUpperCase()}
                          size="small"
                          color={p.status === 'completed' ? 'success' : 'error'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 1: RECEIPTS */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Receipt No.</strong></TableCell>
                    <TableCell><strong>Member</strong></TableCell>
                    <TableCell><strong>Method</strong></TableCell>
                    <TableCell align="right"><strong>Amount Paid</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {r.receipt_number}
                      </TableCell>
                      <TableCell>{r.user?.name || 'Member'}</TableCell>
                      <TableCell>{r.payment_method}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ${parseFloat(r.amount_paid).toFixed(2)}
                      </TableCell>
                      <TableCell>{new Date(r.payment_date || r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ReceiptIcon />}
                          onClick={() => handleViewReceipt(r)}
                        >
                          View & Print
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: INVOICES */}
      {tab === 2 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Invoice #</strong></TableCell>
                    <TableCell><strong>Member</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Issue Date</strong></TableCell>
                    <TableCell><strong>Due Date</strong></TableCell>
                    <TableCell align="right"><strong>Total Amount</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                      <TableCell>{inv.user?.name || 'Member'}</TableCell>
                      <TableCell>{inv.description}</TableCell>
                      <TableCell>{inv.issue_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ${parseFloat(inv.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={(inv.status || 'paid').toUpperCase()}
                          size="small"
                          color={inv.status === 'paid' ? 'success' : 'warning'}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Simulate Payment Dialog */}
      <Dialog open={simulateOpen} onClose={() => setSimulateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Simulate Payment Gateway Transaction</DialogTitle>
        <form onSubmit={handleSimulateSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Payable Category"
                  fullWidth
                  value={simData.payable_type}
                  onChange={(e) => setSimData({ ...simData, payable_type: e.target.value })}
                >
                  <MenuItem value="one_time_service">One-Time Service Pass</MenuItem>
                  <MenuItem value="membership">Membership Subscription</MenuItem>
                  <MenuItem value="class_pass">Special Class Pass</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Amount ($ USD)"
                  type="number"
                  step="0.01"
                  fullWidth
                  required
                  value={simData.amount}
                  onChange={(e) => setSimData({ ...simData, amount: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Simulated Payment Method"
                  fullWidth
                  value={simData.payment_method}
                  onChange={(e) => setSimData({ ...simData, payment_method: e.target.value })}
                >
                  <MenuItem value="card">Simulated Visa / MasterCard</MenuItem>
                  <MenuItem value="momo_mtn">Simulated MTN Mobile Money</MenuItem>
                  <MenuItem value="airtel_money">Simulated Airtel Money</MenuItem>
                  <MenuItem value="cash">Front Desk Cash</MenuItem>
                  <MenuItem value="bank_transfer">Bank Wire</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Simulated Result Status"
                  fullWidth
                  value={simData.simulate_status}
                  onChange={(e) => setSimData({ ...simData, simulate_status: e.target.value })}
                >
                  <MenuItem value="completed">Success (Completed)</MenuItem>
                  <MenuItem value="failed">Simulated Failure (Declined)</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Transaction Description"
                  fullWidth
                  required
                  value={simData.description}
                  onChange={(e) => setSimData({ ...simData, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setSimulateOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Simulating...' : 'Execute Simulated Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </Box>
  );
}
