
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import api from '../../api/axios';

// Local icons: no @mui/icons-material dependency
const FitnessCenterIcon = () => <span role="img" aria-label="fitness">🏋️</span>;
const AddCircleOutlineIcon = () => <span style={{ fontSize: 20 }}>＋</span>;
const CheckCircleOutlineIcon = () => <span style={{ fontSize: 20 }}>✓</span>;
const HistoryIcon = () => <span role="img" aria-label="history">🕘</span>;
const DeleteIcon = () => <span style={{ fontSize: 18 }}>🗑️</span>;

export default function WorkoutPlans() {
  const [plans, setPlans] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);

  // Log Workout Session Dialog
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [sessionNotes, setSessionNotes] = useState('');
  const [performedExercises, setPerformedExercises] = useState([
    {
      exercise_name: 'Bench Press',
      sets_completed: 4,
      reps_completed: '10',
      weight_used_kg: 60,
      notes: ''
    }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [plansRes, sessRes] = await Promise.all([
        api.get('/workout-plans'),
        api.get('/workout-sessions')
      ]);

      const plansData =
        plansRes.data?.plans ||
        plansRes.data?.data ||
        plansRes.data ||
        [];

      const sessionsData =
        sessRes.data?.sessions ||
        sessRes.data?.data ||
        sessRes.data ||
        [];

      const safePlans = Array.isArray(plansData) ? plansData : [];
      const safeSessions = Array.isArray(sessionsData) ? sessionsData : [];

      setPlans(safePlans);
      setSessions(safeSessions);

      setActivePlan((currentPlan) => {
        if (currentPlan) {
          const updatedPlan = safePlans.find(
            (plan) => plan.id === currentPlan.id
          );
          if (updatedPlan) return updatedPlan;
        }
        return safePlans.length > 0 ? safePlans[0] : null;
      });
    } catch (err) {
      console.error('Error loading workout data:', err);
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load workout information.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExerciseRow = () => {
    setPerformedExercises((previous) => [
      ...previous,
      {
        exercise_name: '',
        sets_completed: 3,
        reps_completed: '12',
        weight_used_kg: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveExerciseRow = (index) => {
    setPerformedExercises((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const handleExerciseChange = (index, field, value) => {
    setPerformedExercises((previous) =>
      previous.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise
      )
    );
  };

  const handleLogSubmit = async () => {
    if (!sessionDate || durationMinutes <= 0) {
      setFeedback({
        type: 'error',
        text: 'Please enter a valid workout date and duration.'
      });
      return;
    }

    const validExercises = performedExercises.filter(
      (exercise) => exercise.exercise_name.trim() !== ''
    );

    if (validExercises.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Please enter at least one exercise name.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        workout_plan_id: activePlan?.id || null,
        session_date: sessionDate,
        duration_minutes: durationMinutes,
        notes: sessionNotes,
        exercises: validExercises
      };

      const res = await api.post('/workout-sessions', payload);

      setFeedback({
        type: 'success',
        text: res.data.message || 'Workout session logged successfully!'
      });

      setLogDialogOpen(false);
      setSessionNotes('');
      setPerformedExercises([
        {
          exercise_name: 'Bench Press',
          sets_completed: 4,
          reps_completed: '10',
          weight_used_kg: 60,
          notes: ''
        }
      ]);

      await fetchData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Failed to log workout session.'
      });
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
            Personalized Workout Plans & Daily Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View structured exercise routines prescribed by your personal trainer
            and record completed training sessions.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setLogDialogOpen(true)}
        >
          Log Completed Workout
        </Button>
      </Box>

      {/* Feedback */}
      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setFeedback({ type: '', text: '' })}
        >
          {feedback.text}
        </Alert>
      )}

      {/* Workout Plans */}
      {plans.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
          <strong>No Workout Plan Assigned Yet:</strong> Your assigned coach
          will design a personalized routine suited to your fitness goals.
          You can still log your independent daily sessions using the button above!
        </Alert>
      ) : (
        <Grid container spacing={4} sx={{ mb: 5 }}>
          {/* Plan Selector */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              My Workout Plans
            </Typography>

            {plans.map((p) => {
              const isSelected = activePlan?.id === p.id;

              return (
                <Card
                  key={p.id}
                  onClick={() => setActivePlan(p)}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    borderRadius: 3,
                    border: isSelected
                      ? '2px solid #2563eb'
                      : '1px solid #e2e8f0',
                    bgcolor: isSelected
                      ? 'rgba(37, 99, 235, 0.04)'
                      : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1
                      }}
                    >
                      <Chip
                        label={p.difficulty_level?.toUpperCase() || 'GENERAL'}
                        size="small"
                        color="primary"
                      />

                      <Typography variant="caption" color="text.secondary">
                        By Coach: {p.trainer?.name || 'Trainer'}
                      </Typography>
                    </Box>

                    <Typography variant="subtitle1" fontWeight={700}>
                      {p.title || 'Workout Plan'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {p.description || 'No description available.'}
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Grid>

          {/* Active Plan Details */}
          <Grid item xs={12} md={8}>
            {activePlan && (
              <Card sx={{ borderRadius: 4 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      flexWrap: 'wrap',
                      gap: 2
                    }}
                  >
                    <Box>
                      <Typography variant="h5" fontWeight={800}>
                        {activePlan.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Target Goal:{' '}
                        <strong>
                          {activePlan.goal || 'Hypertrophy & Conditioning'}
                        </strong>
                      </Typography>
                    </Box>

                    <Chip
                      label="TRAINER PRESCRIBED"
                      color="secondary"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Prescribed Exercise Routine:
                  </Typography>

                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 3, mb: 3 }}
                  >
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell><strong>Exercise</strong></TableCell>
                          <TableCell><strong>Day</strong></TableCell>
                          <TableCell align="center"><strong>Sets</strong></TableCell>
                          <TableCell align="center"><strong>Reps</strong></TableCell>
                          <TableCell align="center"><strong>Rest (Sec)</strong></TableCell>
                          <TableCell><strong>Instructions</strong></TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {(activePlan.plan_exercises || activePlan.exercises || []).map(
                          (ex, idx) => (
                            <TableRow key={ex.id || idx} hover>
                              <TableCell sx={{ fontWeight: 600 }}>
                                {ex.exercise?.name || ex.exercise_name || 'Exercise'}
                              </TableCell>
                              <TableCell>{ex.day_of_week || 'Day 1'}</TableCell>
                              <TableCell align="center">
                                {ex.sets ?? '—'}
                              </TableCell>
                              <TableCell align="center">
                                {ex.repetitions || ex.reps || '—'}
                              </TableCell>
                              <TableCell align="center">
                                {ex.rest_seconds ?? 60}s
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontSize: '0.82rem',
                                  color: 'text.secondary'
                                }}
                              >
                                {ex.instructions || 'Maintain strict form'}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={() => setLogDialogOpen(true)}
                    >
                      Log Workout Session for This Plan
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      {/* Workout History */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2
            }}
          >
            <HistoryIcon />
            <Typography variant="h6" fontWeight={700}>
              Recent Logged Workout Sessions
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Plan / Session</strong></TableCell>
                  <TableCell align="center"><strong>Duration</strong></TableCell>
                  <TableCell>
                    <strong>Completed Exercises & Weights</strong>
                  </TableCell>
                  <TableCell><strong>Member Notes</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 4, color: 'text.secondary' }}
                    >
                      No workout sessions logged yet. Record your first training session!
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {s.session_date
                          ? new Date(s.session_date).toLocaleDateString()
                          : '—'}
                      </TableCell>

                      <TableCell>
                        {s.workout_plan?.title || 'General Training'}
                      </TableCell>

                      <TableCell align="center">
                        {s.duration_minutes ?? '—'} min
                      </TableCell>

                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5
                          }}
                        >
                          {(s.exercises || []).map((e, i) => (
                            <Chip
                              key={e.id || i}
                              size="small"
                              label={`${e.exercise_name || 'Exercise'}: ${
                                e.sets_completed ?? 0
                              } sets × ${
                                e.reps_completed || 'reps'
                              } (${e.weight_used_kg || 0}kg)`}
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </TableCell>

                      <TableCell
                        sx={{
                          fontSize: '0.85rem',
                          color: 'text.secondary'
                        }}
                      >
                        {s.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Log Workout Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => !submitting && setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Log Completed Workout Session
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Workout"
                type="date"
                fullWidth
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Duration (Minutes)"
                type="number"
                fullWidth
                value={durationMinutes}
                onChange={(e) =>
                  setDurationMinutes(parseInt(e.target.value, 10) || 0)
                }
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Session Notes / Reflection"
                fullWidth
                multiline
                rows={2}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Great intensity, felt strong on bench press, slight shoulder fatigue."
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Exercises Performed:
          </Typography>

          {performedExercises.map((row, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{ p: 2, mb: 1.5, borderRadius: 2 }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Exercise Name"
                    size="small"
                    fullWidth
                    value={row.exercise_name}
                    onChange={(e) =>
                      handleExerciseChange(idx, 'exercise_name', e.target.value)
                    }
                    placeholder="e.g. Barbell Squat"
                  />
                </Grid>

                <Grid item xs={4} sm={2}>
                  <TextField
                    label="Sets"
                    size="small"
                    type="number"
                    fullWidth
                    value={row.sets_completed}
                    onChange={(e) =>
                      handleExerciseChange(
                        idx,
                        'sets_completed',
                        parseInt(e.target.value, 10) || 0
                      )
                    }
                  />
                </Grid>

                <Grid item xs={4} sm={2}>
                  <TextField
                    label="Reps"
                    size="small"
                    fullWidth
                    value={row.reps_completed}
                    onChange={(e) =>
                      handleExerciseChange(idx, 'reps_completed', e.target.value)
                    }
                    placeholder="10-12"
                  />
                </Grid>

                <Grid item xs={4} sm={3}>
                  <TextField
                    label="Weight (kg)"
                    size="small"
                    type="number"
                    fullWidth
                    value={row.weight_used_kg}
                    onChange={(e) =>
                      handleExerciseChange(
                        idx,
                        'weight_used_kg',
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={1}>
                  {performedExercises.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveExerciseRow(idx)}
                      aria-label="Remove exercise"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Button
            size="small"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAddExerciseRow}
            sx={{ mt: 1 }}
          >
            Add Another Exercise
          </Button>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setLogDialogOpen(false)}
            color="inherit"
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            onClick={handleLogSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Recording...' : 'Save Workout Log'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
