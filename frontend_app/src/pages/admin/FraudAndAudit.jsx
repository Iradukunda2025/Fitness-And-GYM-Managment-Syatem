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
import SecurityIcon from '@mui/icons-material/Security';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import HistoryIcon from '@mui/icons-material/History';
import api from '../../api/axios';

export default function FraudAndAudit() {
  const [tab, setTab] = useState(0);
  const [fraudFlags, setFraudFlags] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('reviewed');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fraudRes, auditRes] = await Promise.allSettled([
        api.get('/fraud-flags'),
        api.get('/audit-logs'),
      ]);
      if (fraudRes.status === 'fulfilled') setFraudFlags(fraudRes.value.data.data || fraudRes.value.data || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data.data || auditRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (flag) => {
    setSelectedFlag(flag);
    setInvestigationNotes(flag.investigation_notes || '');
    setReviewStatus(flag.status === 'pending_review' ? 'reviewed' : flag.status);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlag) return;
    setSubmitting(true);
    try {
      await api.post(`/fraud-flags/${selectedFlag.id}/review`, {
        status: reviewStatus,
        investigation_notes: investigationNotes,
      });
      setFeedback({ type: 'success', text: 'Fraud alert reviewed successfully.' });
      setReviewDialogOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Review submission failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
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
          Fraud Prevention & Security Audit Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Automated rule-based detection for rapid booking anomalies, duplicate check-ins, payment discrepancies, and permanent system audit trail.
        </Typography>
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

      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} indicatorColor="primary" textColor="primary">
          <Tab icon={<WarningAmberIcon />} iconPosition="start" label={`Fraud Alerts & Flags (${fraudFlags.length})`} />
          <Tab icon={<HistoryIcon />} iconPosition="start" label={`System Audit Logs (${auditLogs.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: FRAUD FLAGS */}
      {tab === 0 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Detected Suspicious Activities & Alerts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Triggered automatically by the fraud monitoring heuristics service.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Flag Type</strong></TableCell>
                    <TableCell><strong>User Involved</strong></TableCell>
                    <TableCell align="center"><strong>Severity</strong></TableCell>
                    <TableCell><strong>Reason / Description</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell><strong>Triggered At</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fraudFlags.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No suspicious security flags detected. All operational logs are nominal.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fraudFlags.map((f) => (
                      <TableRow key={f.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>#{f.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {f.flag_type?.replace(/_/g, ' ').toUpperCase()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{f.user?.name || 'Unauthenticated'}</Typography>
                          <Typography variant="caption" color="text.secondary">{f.user?.email}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(f.severity || 'medium').toUpperCase()}
                            size="small"
                            color={getSeverityColor(f.severity)}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260, fontSize: '0.85rem' }}>
                          {f.reason || f.description}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(f.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{new Date(f.created_at).toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            color="secondary"
                            onClick={() => handleOpenReview(f)}
                          >
                            Review
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

      {/* TAB 1: AUDIT LOGS */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              System-Wide Audit Trail
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Immutable chronological record of logins, membership activations, check-ins, and data updates.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Timestamp</strong></TableCell>
                    <TableCell><strong>Actor / User</strong></TableCell>
                    <TableCell><strong>Action Code</strong></TableCell>
                    <TableCell><strong>Entity Type</strong></TableCell>
                    <TableCell><strong>Entity ID</strong></TableCell>
                    <TableCell><strong>Metadata Details</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No audit logs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={{ fontSize: '0.85rem' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {log.user?.name || `User #${log.user_id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.user?.role}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.action}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                          />
                        </TableCell>
                        <TableCell>{log.auditable_type || 'System'}</TableCell>
                        <TableCell>#{log.auditable_id || '—'}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', maxWidth: 300 }}>
                          {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Review Security Incident #{selectedFlag?.id}</DialogTitle>
        <form onSubmit={handleReviewSubmit}>
          <DialogContent dividers>
            <Typography variant="subtitle2" color="error.main" fontWeight={700}>
              Severity: {(selectedFlag?.severity || 'medium').toUpperCase()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
              <strong>Description:</strong> {selectedFlag?.reason || selectedFlag?.description}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Administrative Action / Determination"
                  fullWidth
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                >
                  <MenuItem value="reviewed">Reviewed & Verified (False Positive / Cleared)</MenuItem>
                  <MenuItem value="dismissed">Dismissed Incident</MenuItem>
                  <MenuItem value="escalated">Escalate to Senior Admin</MenuItem>
                  <MenuItem value="account_suspended">Suspend User Account Immediately</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Investigation Notes"
                  fullWidth
                  required
                  multiline
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Summarize investigation steps and reasoning..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setReviewDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="secondary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Save Incident Resolution'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
