
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Avatar
} from '@mui/material';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ClassAttendance() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (selectedScheduleId) {
      fetchBookingsForSchedule(selectedScheduleId);
    } else {
      setBookings([]);
    }
  }, [selectedScheduleId]);

  // Fetch trainer schedules
  const fetchSchedules = async () => {
    setLoading(true);

    try {
      const res = await api.get('/schedules');
      const all = res.data.data || res.data || [];

      const trainerScheds =
        user?.role === 'trainer'
          ? all.filter((s) => Number(s.trainer_id) === Number(user?.id))
          : all;

      setSchedules(trainerScheds);

      if (trainerScheds.length > 0) {
        setSelectedScheduleId(String(trainerScheds[0].id));
      }
    } catch (e) {
      console.error(e);
      setFeedback({
        type: 'error',
        text: e.response?.data?.message || 'Failed to load class schedules.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch bookings for selected schedule
  const fetchBookingsForSchedule = async (scheduleId) => {
    try {
      const res = await api.get(`/bookings?schedule_id=${scheduleId}`);
      setBookings(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
      setFeedback({
        type: 'error',
        text: e.response?.data?.message || 'Failed to load class bookings.'
      });
    }
  };

  // Mark attendance
  const handleMarkAttendance = async (bookingId, status) => {
    try {
      await api.post('/attendance/mark', {
        booking_id: bookingId,
        status: status,
        notes: `Marked by instructor ${user?.name || ''}`
      });

      setFeedback({
        type: 'success',
        text: `Attendance updated to ${status.toUpperCase()}!`
      });

      await fetchBookingsForSchedule(selectedScheduleId);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update attendance.'
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentSchedule = schedules.find(
    (s) => String(s.id) === String(selectedScheduleId)
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f172a">
          Class Attendance Verification
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Monitor confirmed class reservations, verify member check-ins,
          and officially record session attendance.
        </Typography>
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

      {/* Schedule Selector */}
      <Card sx={{ borderRadius: 4, mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Select Class Session</InputLabel>

                <Select
                  value={selectedScheduleId}
                  label="Select Class Session"
                  onChange={(e) => setSelectedScheduleId(e.target.value)}
                >
                  {schedules.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.gym_class?.name} — {s.session_date} (
                      {s.start_time} - {s.end_time})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {currentSchedule && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Studio: ${currentSchedule.room_location || 'Main Gym'}`}
                    variant="outlined"
                  />

                  <Chip
                    label={`Booked: ${bookings.length}/${currentSchedule.capacity}`}
                    color="primary"
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Booked Members Roster */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Session Participant Roster ({bookings.length} Members)
          </Typography>

          {!selectedScheduleId ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No class sessions are available for attendance.
            </Alert>
          ) : (
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 3, mt: 2 }}
            >
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell><strong>Member</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Booking Status</strong></TableCell>
                    <TableCell align="center">
                      <strong>Attendance Record</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Mark Status</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {bookings.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{ py: 4, color: 'text.secondary' }}
                      >
                        No members booked for this scheduled session.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings.map((b) => {
                      const att = b.attendance;
                      const isPresent = att?.status === 'present';
                      const isLate = att?.status === 'late';
                      const isAbsent = att?.status === 'absent';

                      return (
                        <TableRow key={b.id} hover>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: 'secondary.main',
                                  fontWeight: 700
                                }}
                              >
                                {b.user?.name?.charAt(0) || 'M'}
                              </Avatar>

                              <Box>
                                <Typography variant="subtitle2" fontWeight={700}>
                                  {b.user?.name || 'Unknown Member'}
                                </Typography>

                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {b.user?.email || 'No email'}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          <TableCell>{b.user?.phone || '—'}</TableCell>

                          <TableCell>
                            <Chip
                              label={(b.status || 'confirmed').toUpperCase()}
                              size="small"
                              color={
                                b.status === 'confirmed' ? 'primary' : 'default'
                              }
                            />
                          </TableCell>

                          <TableCell align="center">
                            {att ? (
                              <Chip
                                label={att.status.toUpperCase()}
                                size="small"
                                color={
                                  isPresent
                                    ? 'success'
                                    : isLate
                                      ? 'warning'
                                      : 'error'
                                }
                                sx={{ fontWeight: 700 }}
                              />
                            ) : (
                              <Chip
                                label="PENDING"
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>

                          <TableCell align="right">
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 1,
                                justifyContent: 'flex-end',
                                flexWrap: 'wrap'
                              }}
                            >
                              <Button
                                size="small"
                                variant={isPresent ? 'contained' : 'outlined'}
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() =>
                                  handleMarkAttendance(b.id, 'present')
                                }
                              >
                                Present
                              </Button>

                              <Button
                                size="small"
                                variant={isLate ? 'contained' : 'outlined'}
                                color="warning"
                                startIcon={<AccessTimeIcon />}
                                onClick={() =>
                                  handleMarkAttendance(b.id, 'late')
                                }
                              >
                                Late
                              </Button>

                              <Button
                                size="small"
                                variant={isAbsent ? 'contained' : 'outlined'}
                                color="error"
                                startIcon={<CancelOutlinedIcon />}
                                onClick={() =>
                                  handleMarkAttendance(b.id, 'absent')
                                }
                              >
                                Absent
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
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
