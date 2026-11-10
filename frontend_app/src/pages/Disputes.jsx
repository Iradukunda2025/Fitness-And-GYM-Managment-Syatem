
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Local icons - no @mui/icons-material dependency
const ReportProblemIcon = () => (
  <span role="img" aria-label="report problem">⚠️</span>
);

const AddCircleOutlineIcon = () => (
  <span style={{ fontSize: 20, fontWeight: 'bold' }}>＋</span>
);

const CheckCircleIcon = () => (
  <span role="img" aria-label="completed">✅</span>
);

export default function Disputes() {
  const { user, isAdmin } = useAuth();

  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Dialog (for members)
  const [openNew, setOpenNew] = useState(false);

  const [formData, setFormData] = useState({
    category: 'membership',
    subject: '',
    description: ''
  });

  // Admin Resolve Dialog
  const [openResolve, setOpenResolve] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    text: ''
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  // Fetch disputes
  const fetchDisputes = async () => {
    setLoading(true);

    try {
      const res = await api.get('/disputes');

      const data = res.data?.data || res.data || [];

      setDisputes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading disputes:', e);

      setFeedback({
        type: 'error',
        text: e.response?.data?.message || 'Failed to load support tickets.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit new complaint
  const handleSubmitNew = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.description.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter both the subject and description.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/disputes', formData);

      setFeedback({
        type: 'success',
        text: res.data.message || 'Complaint submitted successfully!'
      });

      setOpenNew(false);

      setFormData({
        category: 'membership',
        subject: '',
        description: ''
      });

      await fetchDisputes();
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Failed to submit complaint.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve dispute (Admin)
  const handleResolveSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDispute) return;

    if (!resolutionNotes.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter resolution notes.'
      });
      return;
    }

    setSubmitting(true);

    try {
      await api.put(`/disputes/${selectedDispute.id}/resolve`, {
        status: resolutionStatus,
        resolution_notes: resolutionNotes
      });

      setFeedback({
        type: 'success',
        text: 'Dispute updated successfully.'
      });

      setOpenResolve(false);
      setSelectedDispute(null);

      await fetchDisputes();
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Failed to resolve dispute.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'success';

      case 'under_review':
        return 'warning';

      case 'dismissed':
        return 'default';

      default:
        return 'primary';
    }
  };

  // Loading screen
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 8
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <Typography
            variant="h4"
            fontWeight={800}
            color="#0f172a"
          >
            Support, Inquiries & Disputes
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {isAdmin
              ? 'Review and resolve member feedback, billing discrepancies, class attendance issues, and service complaints.'
              : 'Submit inquiries, report billing issues, or communicate gym facility complaints directly to administration.'}
          </Typography>
        </Box>

        {!isAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setOpenNew(true)}
          >
            File New Complaint / Inquiry
          </Button>
        )}
      </Box>

      {/* Feedback */}
      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() =>
            setFeedback({ type: '', text: '' })
          }
        >
          {feedback.text}
        </Alert>
      )}

      {/* Disputes Table */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            {isAdmin
              ? 'All Member Complaints & Disputes'
              : 'My Support Tickets'}
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 3, mt: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell>
                    <strong>ID</strong>
                  </TableCell>

                  {isAdmin && (
                    <TableCell>
                      <strong>Member</strong>
                    </TableCell>
                  )}

                  <TableCell>
                    <strong>Category</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Subject & Description</strong>
                  </TableCell>

                  <TableCell align="center">
                    <strong>Status</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Date Filed</strong>
                  </TableCell>

                  <TableCell>
                    <strong>Resolution Notes</strong>
                  </TableCell>

                  {isAdmin && (
                    <TableCell align="right">
                      <strong>Action</strong>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {disputes.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 6}
                      align="center"
                      sx={{
                        py: 4,
                        color: 'text.secondary'
                      }}
                    >
                      No support tickets or complaints recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((d) => (
                    <TableRow key={d.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        #{d.id}
                      </TableCell>

                      {isAdmin && (
                        <TableCell>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                          >
                            {d.user?.name || 'Unknown Member'}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {d.user?.email || 'No email'}
                          </Typography>
                        </TableCell>
                      )}

                      <TableCell>
                        <Chip
                          label={(d.category || 'other').toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                        >
                          {d.subject || 'No subject'}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {d.description || 'No description'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={(d.status || 'open').toUpperCase()}
                          size="small"
                          color={getStatusColor(d.status)}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>

                      <TableCell>
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString()
                          : '—'}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: '0.82rem',
                          color: d.resolution_notes
                            ? 'text.primary'
                            : 'text.disabled'
                        }}
                      >
                        {d.resolution_notes ||
                          'Pending administrative review'}
                      </TableCell>

                      {isAdmin && (
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            onClick={() => {
                              setSelectedDispute(d);

                              setResolutionNotes(
                                d.resolution_notes || ''
                              );

                              setResolutionStatus(
                                d.status === 'open'
                                  ? 'resolved'
                                  : d.status || 'resolved'
                              );

                              setOpenResolve(true);
                            }}
                          >
                            Review / Resolve
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Member File Ticket Dialog */}
      <Dialog
        open={openNew}
        onClose={() => !submitting && setOpenNew(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Submit Support Inquiry or Complaint
        </DialogTitle>

        <form onSubmit={handleSubmitNew}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value
                    })
                  }
                >
                  <MenuItem value="membership">
                    Membership & Subscription
                  </MenuItem>

                  <MenuItem value="payment">
                    Payment & Invoicing Discrepancy
                  </MenuItem>

                  <MenuItem value="class">
                    Class Booking & Attendance
                  </MenuItem>

                  <MenuItem value="trainer">
                    Trainer & Coaching Quality
                  </MenuItem>

                  <MenuItem value="other">
                    General Facilities & Hygiene
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Subject"
                  fullWidth
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subject: e.target.value
                    })
                  }
                  placeholder="Summary of the issue"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Detailed Description"
                  fullWidth
                  required
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value
                    })
                  }
                  placeholder="Provide details to help the administration assist you."
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setOpenNew(false)}
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin Resolve Ticket Dialog */}
      <Dialog
        open={openResolve}
        onClose={() => !submitting && setOpenResolve(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Resolve Ticket #{selectedDispute?.id}
        </DialogTitle>

        <form onSubmit={handleResolveSubmit}>
          <DialogContent dividers>
            <Typography
              variant="body2"
              color="text.secondary"
              gutterBottom
            >
              Member:{' '}
              <strong>
                {selectedDispute?.user?.name || 'Unknown Member'}
              </strong>{' '}
              ({selectedDispute?.user?.email || 'No email'})
            </Typography>

            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{ mt: 1 }}
            >
              Subject: {selectedDispute?.subject}
            </Typography>

            <Typography
              variant="body2"
              sx={{ mb: 3, color: 'text.secondary' }}
            >
              {selectedDispute?.description}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Resolution Status"
                  fullWidth
                  value={resolutionStatus}
                  onChange={(e) =>
                    setResolutionStatus(e.target.value)
                  }
                >
                  <MenuItem value="under_review">
                    Under Review
                  </MenuItem>

                  <MenuItem value="resolved">
                    Resolved
                  </MenuItem>

                  <MenuItem value="dismissed">
                    Dismissed
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Resolution Notes to Member"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) =>
                    setResolutionNotes(e.target.value)
                  }
                  placeholder="Explain actions taken to resolve or address the member's ticket."
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={() => setOpenResolve(false)}
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Update Ticket'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
