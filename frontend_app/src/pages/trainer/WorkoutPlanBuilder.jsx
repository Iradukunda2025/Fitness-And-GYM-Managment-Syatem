
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  MenuItem,
  Button,
  Paper,
  IconButton,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';

import api from '../../api/axios';

// Simple icons without @mui/icons-material
const AddCircleOutlineIcon = () => (
  <span style={{ fontSize: '22px', fontWeight: 'bold' }}>＋</span>
);

const DeleteIcon = () => (
  <span style={{ fontSize: '18px' }}>🗑</span>
);

const SaveIcon = () => (
  <span style={{ fontSize: '18px' }}>💾</span>
);

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// Handle different API response formats
const getList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.members)) return data.members;
  if (Array.isArray(data?.exercises)) return data.exercises;

  return [];
};

// Empty exercise template
const createEmptyExercise = () => ({
  exercise_id: null,
  exercise_name: '',
  target_muscle: 'Full Body',
  sets: 3,
  repetitions: '10',
  rest_period_seconds: 60,
  scheduled_day: 'Wednesday',
  trainer_instructions: ''
});

export default function WorkoutPlanBuilder() {
  const location = useLocation();
  const navigate = useNavigate();

  const preselectedId =
    location.state?.preselectedMemberId || '';

  // Data states
  const [members, setMembers] = useState([]);
  const [exercisesBank, setExercisesBank] = useState([]);
  const [loading, setLoading] = useState(true);

  // Workout plan states
  const [memberId, setMemberId] = useState(
    String(preselectedId)
  );

  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const [endDate, setEndDate] = useState('');

  // Initial exercises
  const [exercises, setExercises] = useState([
    {
      exercise_id: null,
      exercise_name: 'Bench Press',
      target_muscle: 'Chest',
      sets: 4,
      repetitions: '10-12',
      rest_period_seconds: 60,
      scheduled_day: 'Monday',
      trainer_instructions:
        'Controlled 2-second negative, explode up.'
    },
    {
      exercise_id: null,
      exercise_name: 'Incline Dumbbell Press',
      target_muscle: 'Upper Chest',
      sets: 3,
      repetitions: '12',
      rest_period_seconds: 60,
      scheduled_day: 'Monday',
      trainer_instructions:
        'Keep elbows tucked at 45 degrees.'
    }
  ]);

  // Submission states
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState({
    type: '',
    text: ''
  });

  // Fetch assigned members and exercise bank
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      try {
        const [memRes, exRes] = await Promise.allSettled([
          api.get('/trainer/assigned-members'),
          api.get('/exercises')
        ]);

        // Load assigned members
        if (memRes.status === 'fulfilled') {
          const memberList = getList(memRes.value);

          setMembers(memberList);

          if (!preselectedId && memberList.length > 0) {
            setMemberId(String(memberList[0].id));
          }
        } else {
          console.error(
            'Failed to load members:',
            memRes.reason
          );
        }

        // Load exercise bank
        if (exRes.status === 'fulfilled') {
          setExercisesBank(getList(exRes.value));
        } else {
          console.error(
            'Failed to load exercises:',
            exRes.reason
          );
        }

        if (memRes.status === 'rejected') {
          setFeedback({
            type: 'error',
            text: 'Unable to load assigned members. Please refresh the page.'
          });
        } else if (exRes.status === 'rejected') {
          setFeedback({
            type: 'warning',
            text: 'Exercise bank could not be loaded. You can still enter exercise names manually.'
          });
        }

      } catch (error) {
        console.error('Initial data loading error:', error);

        setFeedback({
          type: 'error',
          text: 'Unable to load initial data. Please refresh the page.'
        });

      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [preselectedId]);

  // Add new exercise row
  const handleAddRow = () => {
    setExercises((previous) => [
      ...previous,
      createEmptyExercise()
    ]);
  };

  // Remove exercise row
  const handleRemoveRow = (index) => {
    setExercises((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  // Update exercise fields
  const handleExerciseChange = (index, field, value) => {
    setExercises((previous) =>
      previous.map((exercise, i) => {
        if (i !== index) return exercise;

        const updated = {
          ...exercise,
          [field]: value
        };

        // Identify exercise from exercise bank
        if (field === 'exercise_name') {
          const found = exercisesBank.find(
            (item) =>
              item.name?.trim().toLowerCase() ===
              value.trim().toLowerCase()
          );

          updated.exercise_id = found?.id || null;

          if (found?.target_muscle) {
            updated.target_muscle = found.target_muscle;
          }
        }

        return updated;
      })
    );
  };

  // Submit workout plan
  const handleSubmit = async (e) => {
    e.preventDefault();

    setFeedback({
      type: '',
      text: ''
    });

    if (!memberId) {
      setFeedback({
        type: 'error',
        text: 'Please select an assigned member.'
      });
      return;
    }

    const selectedMember = members.find(
      (member) =>
        String(member.id) === String(memberId)
    );

    if (!selectedMember) {
      setFeedback({
        type: 'error',
        text: 'The selected member is not available in your assigned members list.'
      });
      return;
    }

    if (!title.trim()) {
      setFeedback({
        type: 'error',
        text: 'Please enter a workout plan title.'
      });
      return;
    }

    if (!startDate) {
      setFeedback({
        type: 'error',
        text: 'Please select a start date.'
      });
      return;
    }

    if (endDate && endDate < startDate) {
      setFeedback({
        type: 'error',
        text: 'The completion date cannot be earlier than the start date.'
      });
      return;
    }

    if (exercises.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Please add at least one exercise.'
      });
      return;
    }

    const invalidExercise = exercises.some(
      (exercise) =>
        !exercise.exercise_name.trim() ||
        !exercise.sets ||
        exercise.sets < 1 ||
        !String(exercise.repetitions).trim() ||
        exercise.rest_period_seconds < 0
    );

    if (invalidExercise) {
      setFeedback({
        type: 'error',
        text: 'Please complete all required exercise fields and use valid numbers.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        member_id: memberId,
        title: title.trim(),
        objective: objective.trim(),
        description: description.trim(),
        start_date: startDate,
        end_date: endDate || null,

        exercises: exercises.map((exercise) => ({
          ...exercise,
          sets: Number(exercise.sets),
          rest_period_seconds: Number(
            exercise.rest_period_seconds
          ),
          exercise_id: exercise.exercise_id || null
        }))
      };

      const res = await api.post(
        '/workout-plans',
        payload
      );

      setFeedback({
        type: 'success',
        text:
          res.data?.message ||
          'Workout plan successfully created and assigned to member!'
      });

      setTimeout(() => {
        navigate('/trainer/members');
      }, 1500);

    } catch (err) {
      console.error(
        'Workout plan submission error:',
        err
      );

      const errorData = err.response?.data;

      let errorMessage =
        errorData?.message ||
        'Failed to create workout plan. Please verify all fields.';

      if (errorData?.errors) {
        const validationErrors = Object.values(
          errorData.errors
        ).flat();

        if (validationErrors.length > 0) {
          errorMessage = validationErrors.join(' ');
        }
      }

      setFeedback({
        type: 'error',
        text: errorMessage
      });

    } finally {
      setSubmitting(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>

      {/* PAGE HEADER */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={800}
          color="#0f172a"
        >
          Structured Workout Plan Builder
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
        >
          Design custom exercise routines for your assigned
          member with detailed sets, repetitions, rest periods,
          and coaching cues.
        </Typography>
      </Box>

      {/* FEEDBACK MESSAGE */}
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

      {members.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No assigned members were found. Assign a member to
          your trainer account before creating a workout plan.
        </Alert>
      )}

      <form onSubmit={handleSubmit}>

        {/* ROUTINE OVERVIEW */}
        <Card sx={{ borderRadius: 4, mb: 4 }}>
          <CardContent sx={{ p: 4 }}>

            <Typography
              variant="h6"
              fontWeight={700}
              gutterBottom
            >
              1. Routine Overview & Assignment
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>

              {/* MEMBER SELECTION */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Assign to Client / Member"
                  fullWidth
                  required
                  value={memberId}
                  onChange={(e) =>
                    setMemberId(e.target.value)
                  }
                >
                  {members.map((m) => (
                    <MenuItem
                      key={m.id}
                      value={String(m.id)}
                    >
                      {m.name} ({m.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* PLAN TITLE */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Plan Title"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. 4-Week Hypertrophy & Fat Loss"
                />
              </Grid>

              {/* OBJECTIVE */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Primary Fitness Objective"
                  fullWidth
                  value={objective}
                  onChange={(e) =>
                    setObjective(e.target.value)
                  }
                  placeholder="e.g. Upper body hypertrophy, endurance"
                />
              </Grid>

              {/* START DATE */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
                />
              </Grid>

              {/* END DATE */}
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Target Completion Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate }}
                  value={endDate}
                  onChange={(e) =>
                    setEndDate(e.target.value)
                  }
                />
              </Grid>

              {/* DESCRIPTION */}
              <Grid item xs={12}>
                <TextField
                  label="Routine Description & Coach Notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Overview instructions, warm-up protocols, hydration advice..."
                />
              </Grid>

            </Grid>
          </CardContent>
        </Card>

        {/* EXERCISES SECTION */}
        <Card sx={{ borderRadius: 4, mb: 4 }}>
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
              <Typography
                variant="h6"
                fontWeight={700}
              >
                2. Prescribed Exercises & Structured Parameters
              </Typography>

              <Button
                size="small"
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAddRow}
              >
                Add Exercise
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* EXERCISE ROWS */}
            {exercises.map((row, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 3,
                  bgcolor: '#f8fafc'
                }}
              >
                <Grid
                  container
                  spacing={2}
                  alignItems="center"
                >

                  {/* EXERCISE NAME */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Exercise Name"
                      size="small"
                      fullWidth
                      required
                      value={row.exercise_name}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'exercise_name',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Barbell Squat"
                      helperText={
                        exercisesBank.length > 0
                          ? `${exercisesBank.length} exercises available in bank`
                          : ''
                      }
                    />
                  </Grid>

                  {/* TARGET MUSCLE */}
                  <Grid item xs={6} sm={2}>
                    <TextField
                      label="Target Muscle"
                      size="small"
                      fullWidth
                      value={row.target_muscle}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'target_muscle',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Quads / Chest"
                    />
                  </Grid>

                  {/* SCHEDULED DAY */}
                  <Grid item xs={6} sm={2}>
                    <TextField
                      select
                      label="Scheduled Day"
                      size="small"
                      fullWidth
                      value={row.scheduled_day}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'scheduled_day',
                          e.target.value
                        )
                      }
                    >
                      {DAYS.map((day) => (
                        <MenuItem key={day} value={day}>
                          {day}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* SETS */}
                  <Grid item xs={4} sm={1.5}>
                    <TextField
                      label="Sets"
                      size="small"
                      type="number"
                      fullWidth
                      required
                      inputProps={{ min: 1 }}
                      value={row.sets}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'sets',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                    />
                  </Grid>

                  {/* REPETITIONS */}
                  <Grid item xs={4} sm={1.5}>
                    <TextField
                      label="Reps"
                      size="small"
                      fullWidth
                      required
                      value={row.repetitions}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'repetitions',
                          e.target.value
                        )
                      }
                      placeholder="10-12"
                    />
                  </Grid>

                  {/* REST PERIOD */}
                  <Grid item xs={4} sm={1.5}>
                    <TextField
                      label="Rest (Sec)"
                      size="small"
                      type="number"
                      fullWidth
                      inputProps={{ min: 0 }}
                      value={row.rest_period_seconds}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'rest_period_seconds',
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                    />
                  </Grid>

                  {/* TRAINER INSTRUCTIONS */}
                  <Grid item xs={11}>
                    <TextField
                      label="Trainer Coaching Cues / Form Instructions"
                      size="small"
                      fullWidth
                      value={row.trainer_instructions}
                      onChange={(e) =>
                        handleExerciseChange(
                          idx,
                          'trainer_instructions',
                          e.target.value
                        )
                      }
                      placeholder="e.g. Brace core, 3-second negative eccentric tempo"
                    />
                  </Grid>

                  {/* DELETE BUTTON */}
                  <Grid
                    item
                    xs={1}
                    textAlign="center"
                  >
                    {exercises.length > 1 && (
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() =>
                          handleRemoveRow(idx)
                        }
                        aria-label="Remove exercise"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Grid>

                </Grid>
              </Paper>
            ))}

            {/* ADD ANOTHER EXERCISE */}
            <Button
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleAddRow}
              sx={{ mt: 1 }}
            >
              Add Another Exercise
            </Button>

          </CardContent>
        </Card>

        {/* FORM ACTIONS */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            flexWrap: 'wrap',
            mb: 4
          }}
        >

          <Button
            variant="outlined"
            onClick={() =>
              navigate('/trainer/members')
            }
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={
              submitting || members.length === 0
            }
            startIcon={
              submitting ? (
                <CircularProgress
                  size={20}
                  color="inherit"
                />
              ) : (
                <SaveIcon />
              )
            }
          >
            {submitting
              ? 'Assigning Plan...'
              : 'Save & Assign Plan to Member'}
          </Button>

        </Box>
      </form>
    </Box>
  );
}
