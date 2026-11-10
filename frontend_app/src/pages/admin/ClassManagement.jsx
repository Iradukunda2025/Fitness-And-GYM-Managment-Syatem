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
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventNoteIcon from '@mui/icons-material/EventNote';
import api from '../../api/axios';


export default function ClassManagement() {
  const [tab, setTab] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  // Forms
  const [newSchedule, setNewSchedule] = useState({
    class_id: '',
    trainer_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
    capacity: 20,
    room_location: 'Studio A - Aerobics Room',
  });

  const [newClass, setNewClass] = useState({
    category_id: '',
    name: '',
    description: '',
    duration_minutes: 60,
    capacity: 20,
    difficulty_level: 'intermediate',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchEverything();
  }, []);

  const fetchEverything = async () => {
    setLoading(true);
    try {
      const [schedRes, classRes, catRes, trainRes] = await Promise.all([
        api.get('/schedules'),
        api.get('/classes'),
        api.get('/class-categories'),
        api.get('/trainers'),
      ]);
      setSchedules(schedRes.data.data || schedRes.data || []);
      const cl = classRes.data.data || classRes.data || [];
      const ca = catRes.data.data || catRes.data || [];
      const tr = trainRes.data.data || trainRes.data || [];

      setClasses(cl);
      setCategories(ca);
      setTrainers(tr);

      if (cl.length > 0 && !newSchedule.class_id) {
        setNewSchedule((prev) => ({ ...prev, class_id: cl[0].id }));
      }
      if (tr.length > 0 && !newSchedule.trainer_id) {
        setNewSchedule((prev) => ({ ...prev, trainer_id: tr[0].id }));
      }
      if (ca.length > 0 && !newClass.category_id) {
        setNewClass((prev) => ({ ...prev, category_id: ca[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/schedules', newSchedule);
      setFeedback({ type: 'success', text: res.data.message || 'Schedule created successfully!' });
      setScheduleDialogOpen(false);
      fetchEverything();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to create schedule. Trainer may have a scheduling conflict.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/classes', newClass);
      setFeedback({ type: 'success', text: 'New gym class created successfully!' });
      setClassDialogOpen(false);
      fetchEverything();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to create class.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/class-categories', newCategory);
      setFeedback({ type: 'success', text: 'Class category created successfully!' });
      setCategoryDialogOpen(false);
      fetchEverything();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to create category.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSchedule = async (id) => {
    if (!window.confirm('Cancel this class schedule session?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      setFeedback({ type: 'info', text: 'Schedule cancelled.' });
      fetchEverything();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Classes, Categories & Scheduling Master
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage gym fitness offerings, room allocations, capacity limits, and trainer scheduling conflict prevention.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {tab === 0 && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Add Scheduled Session
            </Button>
          )}
          {tab === 1 && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setClassDialogOpen(true)}
            >
              Add Gym Class
            </Button>
          )}
          {tab === 2 && (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setCategoryDialogOpen(true)}
            >
              Add Category
            </Button>
          )}
        </Box>
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
          <Tab icon={<EventNoteIcon />} iconPosition="start" label={`Scheduled Sessions (${schedules.length})`} />
          <Tab icon={<FitnessCenterIcon />} iconPosition="start" label={`Gym Classes (${classes.length})`} />
          <Tab icon={<CategoryIcon />} iconPosition="start" label={`Categories (${categories.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: SCHEDULES */}
      {tab === 0 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Class Name</strong></TableCell>
                    <TableCell><strong>Date & Time</strong></TableCell>
                    <TableCell><strong>Instructor</strong></TableCell>
                    <TableCell><strong>Room / Facility</strong></TableCell>
                    <TableCell align="center"><strong>Capacity & Bookings</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No schedules created. Click "Add Scheduled Session" above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {s.gym_class?.name || 'Class'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.session_date}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.start_time} - {s.end_time}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.trainer?.name || 'Assigned Trainer'}</TableCell>
                        <TableCell>{s.room_location || 'Studio'}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${s.confirmed_bookings_count || 0} / ${s.capacity}`}
                            size="small"
                            color={(s.confirmed_bookings_count || 0) >= s.capacity ? 'error' : 'primary'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={(s.status || 'scheduled').toUpperCase()}
                            size="small"
                            color={s.status === 'scheduled' ? 'success' : 'default'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {s.status === 'scheduled' && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleCancelSchedule(s.id)}
                            >
                              Cancel Session
                            </Button>
                          )}
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

      {/* TAB 1: GYM CLASSES */}
      {tab === 1 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Class Title</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell align="center"><strong>Duration</strong></TableCell>
                    <TableCell align="center"><strong>Default Capacity</strong></TableCell>
                    <TableCell align="center"><strong>Level</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                      <TableCell>
                        <Chip label={c.category?.name || 'Fitness'} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">{c.duration_minutes} min</TableCell>
                      <TableCell align="center">{c.capacity} members</TableCell>
                      <TableCell align="center">
                        <Chip label={c.difficulty_level || 'All Levels'} size="small" color="secondary" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, fontSize: '0.85rem', color: 'text.secondary' }}>
                        {c.description}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: CATEGORIES */}
      {tab === 2 && (
        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Category Name</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{cat.name}</TableCell>
                      <TableCell>{cat.description || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Scheduled Class Session</DialogTitle>
        <form onSubmit={handleCreateSchedule}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Gym Class"
                  fullWidth
                  required
                  value={newSchedule.class_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, class_id: e.target.value })}
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Assigned Trainer"
                  fullWidth
                  required
                  value={newSchedule.trainer_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, trainer_id: e.target.value })}
                >
                  {trainers.map((t) => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Session Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={newSchedule.session_date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, session_date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  label="Start Time"
                  type="time"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  label="End Time"
                  type="time"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Capacity (Seats)"
                  type="number"
                  fullWidth
                  required
                  value={newSchedule.capacity}
                  onChange={(e) => setNewSchedule({ ...newSchedule, capacity: parseInt(e.target.value) || 20 })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Room / Studio Location"
                  fullWidth
                  value={newSchedule.room_location}
                  onChange={(e) => setNewSchedule({ ...newSchedule, room_location: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setScheduleDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Schedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Class Dialog */}
      <Dialog open={classDialogOpen} onClose={() => setClassDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Gym Class</DialogTitle>
        <form onSubmit={handleCreateClass}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Class Title"
                  fullWidth
                  required
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="e.g. Vinyasa Power Yoga"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  required
                  value={newClass.category_id}
                  onChange={(e) => setNewClass({ ...newClass, category_id: e.target.value })}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Duration (Minutes)"
                  type="number"
                  fullWidth
                  value={newClass.duration_minutes}
                  onChange={(e) => setNewClass({ ...newClass, duration_minutes: parseInt(e.target.value) || 60 })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Default Capacity"
                  type="number"
                  fullWidth
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 20 })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setClassDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Class'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Class Category</DialogTitle>
        <form onSubmit={handleCreateCategory}>
          <DialogContent dividers>
            <TextField
              label="Category Name"
              fullWidth
              required
              margin="normal"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="e.g. Spinning & Cycling"
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              margin="normal"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setCategoryDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
