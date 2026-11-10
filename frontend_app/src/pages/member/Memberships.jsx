import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ReceiptModal from '../../components/ReceiptModal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function Memberships() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [myMemberships, setMyMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe Dialog State
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, memsRes] = await Promise.all([
        api.get('/membership-plans'),
        api.get('/memberships'),
      ]);
      setPlans(plansRes.data.data || plansRes.data || []);
      const mems = memsRes.data.data || memsRes.data || [];
      setMyMemberships(mems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeMembership = myMemberships.find((m) => m.status === 'active');

  const handleOpenSubscribe = (plan) => {
    setSelectedPlan(plan);
    setError('');
    setDialogOpen(true);
  };

  const handleSubscribeSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/memberships/subscribe', {
        membership_plan_id: selectedPlan.id,
        payment_method: paymentMethod,
        start_date: new Date().toISOString().split('T')[0],
      });

      setDialogOpen(false);
      // Show official receipt modal
      if (res.data?.data?.receipt) {
        setGeneratedReceipt(res.data.data.receipt);
        setReceiptModalOpen(true);
      }
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenew = async (membershipId) => {
    setSubmitting(true);
    try {
      const res = await api.post(`/memberships/${membershipId}/renew`, {
        payment_method: 'card',
      });
      if (res.data?.data?.receipt) {
        setGeneratedReceipt(res.data.data.receipt);
        setReceiptModalOpen(true);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Renewal failed.');
    } finally {
      setSubmitting(false);
    }
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
          Gym Membership & Subscription Packages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose a suitable membership package to unlock unlimited facility access, personal trainer coaching, and group classes.
        </Typography>
      </Box>

      {/* Active Membership Overview Card */}
      {activeMembership ? (
        <Card sx={{ mb: 5, borderRadius: 4, bgcolor: '#ffffff', border: '2px solid #10b981' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CardMembershipIcon sx={{ color: '#10b981', fontSize: 36 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    CURRENT ACTIVE PLAN
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {activeMembership.plan?.name || 'Standard Gym Plan'}
                  </Typography>
                </Box>
              </Box>
              <Chip label="ACTIVE MEMBERSHIP" color="success" sx={{ fontWeight: 700 }} />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">START DATE</Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(activeMembership.start_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">EXPIRY DATE</Typography>
                <Typography variant="body1" fontWeight={600} color="error.main">
                  {new Date(activeMembership.expiry_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="caption" color="text.secondary" display="block">SUBSCRIPTION PRICE</Typography>
                <Typography variant="body1" fontWeight={700} color="primary">
                  ${activeMembership.plan?.price}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={submitting}
                  onClick={() => handleRenew(activeMembership.id)}
                >
                  Renew Membership
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : (
        <Alert severity="warning" sx={{ mb: 5, borderRadius: 3 }}>
          <strong>No Active Plan:</strong> You do not have an active membership. Subscribe to any of the packages below to activate gym privileges.
        </Alert>
      )}

      {/* Available Plans Grid */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Available Membership Packages
      </Typography>

      <Grid container spacing={4} sx={{ mb: 5 }}>
        {plans.map((plan) => {
          const benefits = Array.isArray(plan.benefits) ? plan.benefits : [];
          const isCurrent = activeMembership?.membership_plan_id === plan.id && activeMembership?.status === 'active';

          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 4,
                  border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  boxShadow: isCurrent ? '0 8px 30px rgba(37,99,235,0.12)' : 'none',
                }}
              >
                <CardContent sx={{ p: 4, flexGrow: 1 }}>
                  {isCurrent && (
                    <Chip label="Your Current Plan" color="primary" size="small" sx={{ mb: 2, fontWeight: 700 }} />
                  )}
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 2 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" fontWeight={800} color="primary">
                      ${plan.price}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      / {plan.duration_days} Days ({plan.duration_months} Month(s))
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Package Privileges:
                  </Typography>
                  <List dense sx={{ mb: 2 }}>
                    {benefits.map((b, idx) => (
                      <ListItem key={idx} disableGutters>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText primary={b} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <Box sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={isCurrent ? 'outlined' : 'contained'}
                    size="large"
                    disabled={isCurrent}
                    onClick={() => handleOpenSubscribe(plan)}
                  >
                    {isCurrent ? 'Currently Subscribed' : 'Subscribe to Package'}
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Subscription & Simulated Payment Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            Subscribe to {selectedPlan?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Simulated Payment Processing Gateway
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Package Duration:</Typography>
              <Typography variant="body2" fontWeight={600}>{selectedPlan?.duration_days} Days</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Activation Date:</Typography>
              <Typography variant="body2" fontWeight={600}>{new Date().toLocaleDateString()}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Total Amount Due:</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="primary">
                ${selectedPlan?.price}
              </Typography>
            </Box>
          </Paper>

          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
              Select Payment Method (Simulated):
            </FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <FormControlLabel
                value="card"
                control={<Radio />}
                label="Simulated Credit / Debit Card (Visa, MasterCard)"
              />
              <FormControlLabel
                value="momo_mtn"
                control={<Radio />}
                label="Simulated MTN Mobile Money (*182#)"
              />
              <FormControlLabel
                value="airtel_money"
                control={<Radio />}
                label="Simulated Airtel Money (*500#)"
              />
              <FormControlLabel
                value="cash"
                control={<Radio />}
                label="Front Desk Cash Simulation"
              />
            </RadioGroup>
          </FormControl>

          <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
            <em>Assessment Note:</em> Payments are simulated securely within this application. No real card or mobile wallet deduction occurs.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubscribeSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <PaymentIcon />}
          >
            {submitting ? 'Processing Payment...' : `Confirm & Pay $${selectedPlan?.price}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Official Receipt Modal */}
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        receipt={generatedReceipt}
      />
    </Box>
  );
}
