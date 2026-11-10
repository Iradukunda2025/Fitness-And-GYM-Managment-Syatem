
import React from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

// Material UI Icons
import PrintIcon from '@mui/icons-material/Print';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

export default function ReceiptModal({ open, onClose, receipt, invoice }) {
  const data = receipt || invoice;

  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const isReceipt = !!receipt;
  const payment = data.payment || data;
  const user = data.user || payment.user;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          pb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FitnessCenterIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            ApexFit Sports & Gym
          </Typography>
        </Box>

        <Chip
          label={isReceipt ? 'OFFICIAL RECEIPT' : 'INVOICE'}
          color={isReceipt ? 'success' : 'primary'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <DialogContent dividers>
        <Box id="printable-receipt" sx={{ p: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary">
              ApexFit Integrated Fitness Facilities
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              RP Karongi Campus Hub | contact@apexfitgym.com | +250 788 123 456
            </Typography>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              mb: 3,
              bgcolor: '#f8fafc',
              borderRadius: 2
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  DOCUMENT NO
                </Typography>

                <Typography variant="body2" fontWeight={700}>
                  {data.receipt_number || data.invoice_number || `REC-${data.id}`}
                </Typography>
              </Grid>

              <Grid item xs={6} textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  DATE ISSUED
                </Typography>

                <Typography variant="body2" fontWeight={600}>
                  {new Date(
                    data.created_at || data.issued_date || Date.now()
                  ).toLocaleDateString()}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  BILLED TO
                </Typography>

                <Typography variant="body2" fontWeight={600}>
                  {user?.name || 'Valued Member'}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Grid>

              <Grid item xs={6} textAlign="right">
                <Typography variant="caption" color="text.secondary" display="block">
                  PAYMENT STATUS
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 0.5,
                    color: '#10b981'
                  }}
                >
                  <CheckCircleIcon fontSize="small" />

                  <Typography variant="body2" fontWeight={700}>
                    {(data.status || 'Paid').toUpperCase()}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell>
                    <strong>Description</strong>
                  </TableCell>

                  <TableCell align="center">
                    <strong>Method</strong>
                  </TableCell>

                  <TableCell align="right">
                    <strong>Amount</strong>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                <TableRow>
                  <TableCell>
                    {data.description ||
                      payment?.notes ||
                      'Membership Subscription / Package Fee'}
                  </TableCell>

                  <TableCell align="center">
                    {(
                      payment?.payment_method ||
                      data.payment_method ||
                      'Simulated Payment'
                    ).toUpperCase()}
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    ${parseFloat(data.amount || payment?.amount || 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: 220 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Subtotal:
                </Typography>

                <Typography variant="body2">
                  ${parseFloat(data.amount || payment?.amount || 0).toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.5
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Tax (0%):
                </Typography>

                <Typography variant="body2">$0.00</Typography>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Total Paid:
                </Typography>

                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  ${parseFloat(data.amount || payment?.amount || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.5,
              bgcolor: '#f1f5f9',
              borderRadius: 2,
              textAlign: 'center'
            }}
          >
            <Typography variant="caption" color="text.secondary" display="block">
              Thank you for training with ApexFit. This computer-generated
              receipt is valid without signature.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>

        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<PrintIcon />}
        >
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
