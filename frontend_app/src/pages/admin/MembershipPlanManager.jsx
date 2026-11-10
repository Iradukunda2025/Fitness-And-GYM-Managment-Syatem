
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import api from '../../api/axios';

export default function MembershipPlanManager() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: 1,
    price: 50,
    access_conditions: 'All Facilities, 24/7 Access',
    included_services: ['Gym Equipment', 'Locker Room', 'Group Classes'],
    is_active: true
  });

  const [servicesText, setServicesText] = useState(
    'Gym Equipment, Locker Room, Group Classes'
  );

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch membership plans
  const fetchPlans = async () => {
    setLoading(true);

    try {
      const res = await api.get('/membership-plans');
      setPlans(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      setFeedback({
        type: 'error',
        text: e.response?.data?.message || 'Failed to load membership plans.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open create dialog
  const handleOpenCreate = () => {
    setEditingPlanId(null);

    setFormData({
      name: '',
      description: '',
      duration_months: 1,
      price: 50,
      access_conditions: 'All Facilities, 24/7 Access',
      included_services: ['Gym Equipment', 'Locker Room'],
      is_active: true
    });

    setServicesText('Gym Equipment, Locker Room');
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (plan) => {
    setEditingPlanId(plan.id);

    const services = Array.isArray(plan.included_services)
      ? plan.included_services
      : Array.isArray(plan.benefits)
        ? plan.benefits
        : [];

    setFormData({
      name: plan.name,
      description: plan.description || '',
      duration_months: plan.duration_months || 1,
      price: plan.price,
      access_conditions: plan.access_conditions || '',
      included_services: services,
      is_active: Boolean(plan.is_active)
    });

    setServicesText(services.join(', '));
    setDialogOpen(true);
  };

  // Create or update membership plan
  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setFeedback({ type: '', text: '' });

    const payload = {
      ...formData,
      included_services: servicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    };

    try {
      if (editingPlanId) {
        await api.put(`/membership-plans/${editingPlanId}`, payload);

        setFeedback({
          type: 'success',
          text: 'Membership plan updated successfully!'
        });
      } else {
        await api.post('/membership-plans', payload);

        setFeedback({
          type: 'success',
          text: 'New membership plan created successfully!'
        });
      }

      setDialogOpen(false);
      await fetchPlans();

    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Operation failed.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete or deactivate membership plan
  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete or deactivate this plan?')) {
      return;
    }

    try {
      await api.delete(`/membership-plans/${planId}`);

      setFeedback({
        type: 'info',
        text: 'Membership plan removed/deactivated.'
      });

      await fetchPlans();

    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Delete failed.'
      });
    }
  };

  return (
    <Box>
      {/* Page Header */}
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Membership Packages & Rates Configuration
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Configure monthly, quarterly, and annual subscription packages,
            pricing models, and member benefit checklists.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleIcon />}
          onClick={handleOpenCreate}
        >
          Create New Package
        </Button>
      </Box>

      {/* Feedback Message */}
      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setFeedback({ type: '', text: '' })}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Membership Plans Table */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 3 }}
            >
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Plan Name</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                    <TableCell align="right">
                      <strong>Price (USD)</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Included Services & Privileges</strong>
                    </TableCell>
                    <TableCell align="center">
                      <strong>Status</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        align="center"
                        sx={{ py: 4, color: 'text.secondary' }}
                      >
                        No membership plans found. Click "Create New Package" to add one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((p) => {
                      const benefits = Array.isArray(p.included_services)
                        ? p.included_services
                        : Array.isArray(p.benefits)
                          ? p.benefits
                          : [];

                      return (
                        <TableRow key={p.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {p.name}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                              {p.description}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            {p.duration_months} Month(s)
                          </TableCell>

                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: 'primary.main',
                              fontSize: '1.05rem'
                            }}
                          >
                            ${parseFloat(p.price).toFixed(2)}
                          </TableCell>

                          <TableCell sx={{ maxWidth: 300 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.5
                              }}
                            >
                              {benefits.map((b, idx) => (
                                <Chip
                                  key={idx}
                                  label={b}
                                  size="small"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={p.is_active ? 'ACTIVE' : 'INACTIVE'}
                              size="small"
                              color={p.is_active ? 'success' : 'default'}
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                justifyContent: 'flex-end'
                              }}
                            >
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEdit(p)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>

                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(p.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Membership Package Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPlanId
            ? 'Edit Membership Plan'
            : 'Create New Membership Package'}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Package Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Gold Quarterly Membership"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Price ($ USD)"
                  type="number"
                  inputProps={{ min: 0, step: '0.01' }}
                  fullWidth
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Duration (Months)"
                  type="number"
                  inputProps={{ min: 1, step: 1 }}
                  fullWidth
                  required
                  value={formData.duration_months}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_months: parseInt(e.target.value, 10) || 1
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Included Services (Comma separated)"
                  fullWidth
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                  placeholder="Locker Room, Sauna, Group Classes, Nutrition Guide"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Access Conditions / Notes"
                  fullWidth
                  value={formData.access_conditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      access_conditions: e.target.value
                    })
                  }
                  placeholder="e.g. 24/7 all facilities access"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Package Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value
                    })
                  }
                  placeholder="Brief pitch for this membership package"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked
                        })
                      }
                      color="primary"
                    />
                  }
                  label="Package Active & Available for Public Subscription"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setDialogOpen(false)}
              color="inherit"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Package'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
