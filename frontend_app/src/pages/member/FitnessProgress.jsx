
import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
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
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Local icons (no external icon package required)
const ShowChartIcon = () => (
  <span style={{ fontSize: 22 }}>📈</span>
);

const AddCircleOutlineIcon = () => (
  <span style={{ fontSize: 22, fontWeight: 'bold' }}>＋</span>
);

const MonitorWeightIcon = () => (
  <span style={{ fontSize: 22 }}>⚖️</span>
);

const SpeedIcon = () => (
  <span style={{ fontSize: 22 }}>⚡</span>
);

// Components and API
import StatCard from '../../components/StatCard';
import api from '../../api/axios';

export default function FitnessProgress() {

  // Fitness history states
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form initial values
  const initialFormData = {
    recorded_date: new Date().toISOString().split('T')[0],
    weight_kg: 70,
    height_cm: 175,
    body_fat_percentage: 18,
    chest_cm: 95,
    waist_cm: 80,
    arms_cm: 34,
    workout_frequency_weekly: 4,
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // Submission states
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState({
    type: '',
    text: ''
  });

  // Fetch metrics when component loads
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Retrieve fitness metrics from backend
  const fetchMetrics = async () => {
    setLoading(true);

    try {
      const res = await api.get('/fitness-metrics');

      const responseData = res.data?.data || res.data || {};

      setHistory(
        Array.isArray(responseData.history)
          ? responseData.history
          : []
      );

      setSummary(responseData.summary || {});

    } catch (err) {
      console.error('Error fetching fitness metrics:', err);

      setFeedback({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Unable to retrieve fitness metrics. Please try again.'
      });

    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Open measurement dialog
  const handleOpenDialog = () => {
    setFeedback({
      type: '',
      text: ''
    });

    setDialogOpen(true);
  };

  // Close measurement dialog
  const handleCloseDialog = () => {
    if (submitting) return;

    setDialogOpen(false);
  };

  // Save fitness measurements
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.recorded_date ||
      !formData.weight_kg ||
      !formData.height_cm ||
      Number(formData.weight_kg) <= 0 ||
      Number(formData.height_cm) <= 0
    ) {
      setFeedback({
        type: 'error',
        text: 'Please enter a valid date, weight and height.'
      });

      return;
    }

    // Validate numeric fields
    const numericFields = [
      'weight_kg',
      'height_cm',
      'body_fat_percentage',
      'chest_cm',
      'waist_cm',
      'arms_cm',
      'workout_frequency_weekly'
    ];

    for (const field of numericFields) {
      const value = formData[field];

      if (
        value !== '' &&
        (!Number.isFinite(Number(value)) || Number(value) < 0)
      ) {
        setFeedback({
          type: 'error',
          text: `Please enter a valid value for ${field.replaceAll('_', ' ')}.`
        });

        return;
      }
    }

    if (
      formData.body_fat_percentage !== '' &&
      Number(formData.body_fat_percentage) > 100
    ) {
      setFeedback({
        type: 'error',
        text: 'Body fat percentage cannot exceed 100%.'
      });

      return;
    }

    setSubmitting(true);

    setFeedback({
      type: '',
      text: ''
    });

    try {
      const payload = {
        ...formData,
        weight_kg: Number(formData.weight_kg),
        height_cm: Number(formData.height_cm),
        body_fat_percentage:
          formData.body_fat_percentage === ''
            ? null
            : Number(formData.body_fat_percentage),
        chest_cm:
          formData.chest_cm === '' ? null : Number(formData.chest_cm),
        waist_cm:
          formData.waist_cm === '' ? null : Number(formData.waist_cm),
        arms_cm:
          formData.arms_cm === '' ? null : Number(formData.arms_cm),
        workout_frequency_weekly:
          formData.workout_frequency_weekly === ''
            ? null
            : Number(formData.workout_frequency_weekly)
      };

      const res = await api.post('/fitness-metrics', payload);

      setFeedback({
        type: 'success',
        text:
          res.data?.message ||
          'Fitness measurements recorded successfully!'
      });

      setDialogOpen(false);

      setFormData({
        ...initialFormData,
        recorded_date: new Date().toISOString().split('T')[0]
      });

      // Refresh history and summary
      await fetchMetrics();

    } catch (err) {
      console.error('Error saving fitness metrics:', err);

      setFeedback({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Failed to record measurements. Please verify your information.'
      });

    } finally {
      setSubmitting(false);
    }
  };

  // BMI color classification
  const getBmiColor = (bmi) => {
    const value = Number(bmi);

    if (!bmi || !Number.isFinite(value)) return 'default';
    if (value < 18.5) return 'info';
    if (value <= 24.9) return 'success';
    if (value <= 29.9) return 'warning';

    return 'error';
  };

  // BMI category
  const getBmiCategory = (bmi) => {
    const value = Number(bmi);

    if (!bmi || !Number.isFinite(value)) return 'N/A';
    if (value < 18.5) return 'Underweight';
    if (value <= 24.9) return 'Normal Weight';
    if (value <= 29.9) return 'Overweight';

    return 'Obese';
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

  // Prepare chart data
  const chartData = history
    .slice()
    .sort(
      (a, b) =>
        new Date(a.recorded_date) - new Date(b.recorded_date)
    )
    .map((m) => ({
      date: new Date(m.recorded_date).toLocaleDateString(
        undefined,
        {
          month: 'short',
          day: 'numeric'
        }
      ),
      Weight: Number(m.weight_kg) || 0,
      BMI: Number(m.bmi) || 0,
      BodyFat: Number(m.body_fat_percentage) || 0
    }));

  return (
    <Box>

      {/* PAGE HEADER */}
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
            Fitness Metrics & Progress Tracking
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Monitor historical changes in body weight,
            calculated BMI, body fat percentage, and
            physique circumference measurements.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenDialog}
        >
          Log New Measurements
        </Button>
      </Box>

      {/* FEEDBACK */}
      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() =>
            setFeedback({
              type: '',
              text: ''
            })
          }
        >
          {feedback.text}
        </Alert>
      )}

      {/* KPI STATISTICS */}
      <Grid container spacing={3} sx={{ mb: 4 }}>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Current Weight"
            value={
              summary?.current_weight != null
                ? `${summary.current_weight} kg`
                : 'N/A'
            }
            subtitle={`Overall change: ${
              Number(summary?.total_weight_change) > 0 ? '+' : ''
            }${summary?.total_weight_change ?? 0} kg`}
            icon={<MonitorWeightIcon />}
            color="#2563eb"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Body Mass Index (BMI)"
            value={
              summary?.current_bmi != null
                ? summary.current_bmi
                : 'N/A'
            }
            subtitle={`Classification: ${getBmiCategory(
              summary?.current_bmi
            )}`}
            icon={<SpeedIcon />}
            color={
              Number(summary?.current_bmi) <= 24.9
                ? '#10b981'
                : '#f59e0b'
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Body Fat Percentage"
            value={
              summary?.current_body_fat != null
                ? `${summary.current_body_fat}%`
                : 'N/A'
            }
            subtitle="Adipose tissue estimation"
            icon={<ShowChartIcon />}
            color="#06b6d4"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Logged Records"
            value={summary?.records_count ?? history.length}
            subtitle={
              summary?.latest_date
                ? `Latest: ${summary.latest_date}`
                : 'Start logging today'
            }
            icon={<ShowChartIcon />}
            color="#8b5cf6"
          />
        </Grid>

      </Grid>

      {/* PROGRESS CHARTS */}
      {chartData.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>

          {/* WEIGHT AND BMI CHART */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                borderRadius: 4,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 3 }}>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                >
                  Body Weight (kg) & BMI Trend Over Time
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: 'block'
                  }}
                >
                  Progressive tracking based on chronological measurements
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    height: 320,
                    mt: 2
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                      />

                      <YAxis
                        yAxisId="left"
                        stroke="#2563eb"
                        domain={['auto', 'auto']}
                      />

                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#10b981"
                        domain={['auto', 'auto']}
                      />

                      <Tooltip />
                      <Legend />

                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="Weight"
                        name="Weight (kg)"
                        stroke="#2563eb"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />

                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="BMI"
                        name="BMI"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />

                    </LineChart>
                  </ResponsiveContainer>
                </Box>

              </CardContent>
            </Card>
          </Grid>

          {/* BODY FAT CHART */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 4,
                height: '100%'
              }}
            >
              <CardContent sx={{ p: 3 }}>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  gutterBottom
                >
                  Body Fat % Progress
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    display: 'block'
                  }}
                >
                  Fat loss / conditioning trajectory
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    height: 320,
                    mt: 2
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -20,
                        bottom: 0
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                      />

                      <XAxis
                        dataKey="date"
                        stroke="#64748b"
                      />

                      <YAxis
                        stroke="#06b6d4"
                        domain={[0, 40]}
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="BodyFat"
                        name="Body Fat %"
                        stroke="#06b6d4"
                        fill="rgba(6, 182, 212, 0.2)"
                      />

                    </AreaChart>
                  </ResponsiveContainer>
                </Box>

              </CardContent>
            </Card>
          </Grid>

        </Grid>
      )}

      {/* HISTORICAL MEASUREMENTS */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>

          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            Historical Measurement Records
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 3,
              overflowX: 'auto'
            }}
          >
            <Table sx={{ minWidth: 950 }}>

              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell><strong>Date Recorded</strong></TableCell>
                  <TableCell align="center"><strong>Weight</strong></TableCell>
                  <TableCell align="center"><strong>Height</strong></TableCell>
                  <TableCell align="center"><strong>BMI</strong></TableCell>
                  <TableCell align="center"><strong>Body Fat</strong></TableCell>
                  <TableCell align="center"><strong>Waist</strong></TableCell>
                  <TableCell align="center"><strong>Chest</strong></TableCell>
                  <TableCell align="center"><strong>Arms</strong></TableCell>
                  <TableCell><strong>Notes</strong></TableCell>
                </TableRow>
              </TableHead>

              <TableBody>

                {history.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        py: 4,
                        color: 'text.secondary'
                      }}
                    >
                      No measurement history recorded yet.
                      Click "Log New Measurements" to add your first record.
                    </TableCell>
                  </TableRow>
                ) : (
                  history
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.recorded_date) -
                        new Date(a.recorded_date)
                    )
                    .map((m) => (
                      <TableRow key={m.id} hover>

                        <TableCell sx={{ fontWeight: 600 }}>
                          {new Date(
                            m.recorded_date
                          ).toLocaleDateString()}
                        </TableCell>

                        <TableCell align="center">
                          {m.weight_kg} kg
                        </TableCell>

                        <TableCell align="center">
                          {m.height_cm} cm
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={`${
                              m.bmi ?? 'N/A'
                            } (${getBmiCategory(m.bmi)})`}
                            size="small"
                            color={getBmiColor(m.bmi)}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          {m.body_fat_percentage != null
                            ? `${m.body_fat_percentage}%`
                            : '—'}
                        </TableCell>

                        <TableCell align="center">
                          {m.waist_cm != null
                            ? `${m.waist_cm} cm`
                            : '—'}
                        </TableCell>

                        <TableCell align="center">
                          {m.chest_cm != null
                            ? `${m.chest_cm} cm`
                            : '—'}
                        </TableCell>

                        <TableCell align="center">
                          {m.arms_cm != null
                            ? `${m.arms_cm} cm`
                            : '—'}
                        </TableCell>

                        <TableCell
                          sx={{
                            fontSize: '0.85rem',
                            color: 'text.secondary'
                          }}
                        >
                          {m.notes || '—'}
                        </TableCell>

                      </TableRow>
                    ))
                )}

              </TableBody>
            </Table>
          </TableContainer>

        </CardContent>
      </Card>

      {/* ADD MEASUREMENT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Log Body Measurements & Progress
        </DialogTitle>

        <form onSubmit={handleSubmit}>

          <DialogContent dividers>

            <Grid container spacing={2}>

              {/* DATE */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Date Recorded"
                  name="recorded_date"
                  type="date"
                  required
                  fullWidth
                  value={formData.recorded_date}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* WEIGHT */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Weight (kg)"
                  name="weight_kg"
                  type="number"
                  inputProps={{
                    min: 0.1,
                    step: 0.1
                  }}
                  required
                  fullWidth
                  value={formData.weight_kg}
                  onChange={handleChange}
                />
              </Grid>

              {/* HEIGHT */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Height (cm)"
                  name="height_cm"
                  type="number"
                  inputProps={{
                    min: 1,
                    step: 0.5
                  }}
                  required
                  fullWidth
                  value={formData.height_cm}
                  onChange={handleChange}
                />
              </Grid>

              {/* BODY FAT */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Body Fat (%)"
                  name="body_fat_percentage"
                  type="number"
                  inputProps={{
                    min: 0,
                    max: 100,
                    step: 0.1
                  }}
                  fullWidth
                  value={formData.body_fat_percentage}
                  onChange={handleChange}
                />
              </Grid>

              {/* WAIST */}
              <Grid item xs={4}>
                <TextField
                  label="Waist (cm)"
                  name="waist_cm"
                  type="number"
                  inputProps={{
                    min: 0,
                    step: 0.1
                  }}
                  fullWidth
                  value={formData.waist_cm}
                  onChange={handleChange}
                />
              </Grid>

              {/* CHEST */}
              <Grid item xs={4}>
                <TextField
                  label="Chest (cm)"
                  name="chest_cm"
                  type="number"
                  inputProps={{
                    min: 0,
                    step: 0.1
                  }}
                  fullWidth
                  value={formData.chest_cm}
                  onChange={handleChange}
                />
              </Grid>

              {/* ARMS */}
              <Grid item xs={4}>
                <TextField
                  label="Arms (cm)"
                  name="arms_cm"
                  type="number"
                  inputProps={{
                    min: 0,
                    step: 0.1
                  }}
                  fullWidth
                  value={formData.arms_cm}
                  onChange={handleChange}
                />
              </Grid>

              {/* WORKOUT FREQUENCY */}
              <Grid item xs={12}>
                <TextField
                  label="Workout Frequency (per week)"
                  name="workout_frequency_weekly"
                  type="number"
                  inputProps={{
                    min: 0,
                    max: 7,
                    step: 1
                  }}
                  fullWidth
                  value={formData.workout_frequency_weekly}
                  onChange={handleChange}
                />
              </Grid>

              {/* NOTES */}
              <Grid item xs={12}>
                <TextField
                  label="Observations / Fitness Reflection"
                  name="notes"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="e.g. Muscle soreness decreasing, feeling lighter and energetic."
                />
              </Grid>

            </Grid>

          </DialogContent>

          {/* DIALOG ACTIONS */}
          <DialogActions sx={{ px: 3, py: 2 }}>

            <Button
              onClick={handleCloseDialog}
              color="inherit"
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress
                    size={18}
                    color="inherit"
                  />
                ) : (
                  <AddCircleOutlineIcon />
                )
              }
            >
              {submitting ? 'Saving...' : 'Save Metrics'}
            </Button>

          </DialogActions>

        </form>
      </Dialog>

    </Box>
  );
}
