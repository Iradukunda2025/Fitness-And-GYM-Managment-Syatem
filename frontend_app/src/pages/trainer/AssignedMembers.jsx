import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ChatIcon from '@mui/icons-material/Chat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axios';

export default function AssignedMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trainer/assigned-members');
      setMembers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = (member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
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
            Assigned Member Clients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View member profiles, medical restrictions, fitness targets, and track their custom exercise prescriptions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AssignmentIcon />}
          onClick={() => navigate('/trainer/workout-builder')}
        >
          Build Workout Plan
        </Button>
      </Box>

      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><strong>Member</strong></TableCell>
                  <TableCell><strong>Phone / Contact</strong></TableCell>
                  <TableCell><strong>Active Plan</strong></TableCell>
                  <TableCell><strong>Primary Goals</strong></TableCell>
                  <TableCell><strong>Health & Medical Notes</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No members currently assigned to you.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => {
                    const prof = m.member_profile || {};
                    const plan = m.active_membership?.plan;
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                              {m.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {m.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {m.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{m.phone || '—'}</TableCell>
                        <TableCell>
                          {plan ? (
                            <Chip label={plan.name} size="small" color="primary" />
                          ) : (
                            <Chip label="No Active Plan" size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Typography variant="body2" noWrap>
                            {prof.fitness_goals || 'Not specified'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          {prof.health_notes ? (
                            <Chip
                              label={prof.health_notes}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ maxWidth: 200 }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">None</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleOpenDetails(m)}
                            >
                              Profile
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              startIcon={<ChatIcon />}
                              onClick={() => navigate('/messages')}
                            >
                              Chat
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Client Profile: {selectedMember?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">EMAIL ADDRESS</Typography>
              <Typography variant="body2" fontWeight={600}>{selectedMember?.email}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">PHONE NUMBER</Typography>
              <Typography variant="body2" fontWeight={600}>{selectedMember?.phone || 'N/A'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">GENDER</Typography>
              <Typography variant="body2" fontWeight={600}>
                {(selectedMember?.member_profile?.gender || 'N/A').toUpperCase()}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" display="block">DATE OF BIRTH</Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedMember?.member_profile?.date_of_birth || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" display="block">FITNESS TARGETS & OBJECTIVES</Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedMember?.member_profile?.fitness_goals || 'General conditioning and health'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">MEDICAL / INJURY PRECAUTIONS</Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                {selectedMember?.member_profile?.health_notes || 'None recorded'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary" display="block">EMERGENCY CONTACT PERSON</Typography>
              <Typography variant="body2" fontWeight={600}>
                {selectedMember?.member_profile?.emergency_contact_name || 'N/A'} ({selectedMember?.member_profile?.emergency_contact_relation || 'Relation'}) - {selectedMember?.member_profile?.emergency_contact_phone || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} color="inherit">
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => {
              setDetailsOpen(false);
              navigate('/trainer/workout-builder', { state: { preselectedMemberId: selectedMember?.id } });
            }}
          >
            Create Routine for Member
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
