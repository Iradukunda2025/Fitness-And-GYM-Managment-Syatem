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
  Avatar,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../api/axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Assign Trainer Dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState('');

  // Create User Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'member',
    password: '',
    password_confirmation: '',
    status: 'active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
    fetchTrainers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/trainers');
      setTrainers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setFeedback({ type: 'success', text: `User status changed to ${newStatus.toUpperCase()}` });
      fetchUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update status.' });
    }
  };

  const handleOpenAssign = (member) => {
    setSelectedMember(member);
    setSelectedTrainerId(member.member_profile?.assigned_trainer_id || '');
    setAssignDialogOpen(true);
  };

  const handleAssignTrainerSubmit = async () => {
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/members/${selectedMember.id}/assign-trainer`, {
        trainer_id: selectedTrainerId || null,
      });
      setFeedback({ type: 'success', text: 'Trainer assigned successfully to member.' });
      setAssignDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Assignment failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (newUser.password !== newUser.password_confirmation) {
      setFeedback({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/admin/users', newUser);
      setFeedback({ type: 'success', text: 'New user created successfully!' });
      setCreateDialogOpen(false);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: 'member',
        password: '',
        password_confirmation: '',
        status: 'active',
      });
      fetchUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to create user.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    const matchesStatus = statusFilter ? u.status === statusFilter : true;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Member & Staff User Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts, assign certified trainers to members, and enforce account statuses.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add New User
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

      {/* Filter Bar */}
      <Card sx={{ borderRadius: 4, mb: 4 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by name or email address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="trainer">Trainer</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
                <MenuItem value="deactivated">Deactivated</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell><strong>Role</strong></TableCell>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell><strong>Assigned Trainer / Specialization</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Administrative Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No users match the specified criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMember = u.role === 'member';
                      const assignedTrainer = u.member_profile?.assigned_trainer;

                      return (
                        <TableRow key={u.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ bgcolor: u.role === 'admin' ? 'error.main' : u.role === 'trainer' ? 'secondary.main' : 'primary.main' }}>
                                {u.name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {u.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {u.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.role.toUpperCase()}
                              size="small"
                              color={u.role === 'admin' ? 'error' : u.role === 'trainer' ? 'secondary' : 'default'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>{u.phone || '—'}</TableCell>
                          <TableCell>
                            {isMember ? (
                              assignedTrainer ? (
                                <Chip label={`Coach: ${assignedTrainer.name}`} size="small" color="primary" variant="outlined" />
                              ) : (
                                <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                              )
                            ) : u.role === 'trainer' ? (
                              <Typography variant="caption" color="text.secondary">
                                {u.trainer_profile?.specialization || 'Certified Coach'}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">System Staff</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={u.status}
                              onChange={(e) => handleStatusChange(u.id, e.target.value)}
                              sx={{ minWidth: 120 }}
                            >
                              <MenuItem value="active">Active</MenuItem>
                              <MenuItem value="suspended">Suspended</MenuItem>
                              <MenuItem value="deactivated">Deactivated</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell align="right">
                            {isMember && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<SupervisorAccountIcon />}
                                onClick={() => handleOpenAssign(u)}
                              >
                                Assign Coach
                              </Button>
                            )}
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

      {/* Assign Trainer Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Assign Trainer to {selectedMember?.name}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fitness Goals: <strong>{selectedMember?.member_profile?.fitness_goals || 'General Health'}</strong>
          </Typography>
          <FormControl fullWidth size="small">
            <TextField
              select
              label="Select Certified Coach"
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
            >
              <MenuItem value="">-- Unassign Trainer --</MenuItem>
              {trainers.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} ({t.trainer_profile?.specialization || 'Fitness Trainer'})
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAssignDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleAssignTrainerSubmit}
            variant="contained"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Trainer Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New User Account</DialogTitle>
        <form onSubmit={handleCreateUserSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  fullWidth
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Role"
                  fullWidth
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <MenuItem value="member">Member</MenuItem>
                  <MenuItem value="trainer">Trainer</MenuItem>
                  <MenuItem value="admin">Administrator</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={newUser.password_confirmation}
                  onChange={(e) => setNewUser({ ...newUser, password_confirmation: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
