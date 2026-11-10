
import React, { useState, useEffect } from 'react';

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

// Local icons (no external icon package required)
const EventAvailableIcon = () => <span>📅</span>;
const AccessTimeIcon = () => <span>🕒</span>;
const PersonIcon = () => <span>👤</span>;
const LocationOnIcon = () => <span>📍</span>;
const CheckCircleOutlineIcon = () => <span>✓</span>;
const CancelOutlinedIcon = () => <span>✕</span>;

// API
import api from '../../api/axios';

export default function Classes() {
  const [tab, setTab] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({
    type: '',
    text: ''
  });

  // Booking Confirmation Dialog
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Retrieve classes, bookings and categories
  const fetchData = async () => {
    setLoading(true);

    try {
      const [schedRes, bookRes, catRes] = await Promise.all([
        api.get('/schedules?upcoming=true'),
        api.get('/bookings'),
        api.get('/class-categories')
      ]);

      const scheduleData = schedRes.data?.data ?? schedRes.data ?? [];
      const bookingData = bookRes.data?.data ?? bookRes.data ?? [];
      const categoryData = catRes.data?.data ?? catRes.data ?? [];

      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);
      setBookings(Array.isArray(bookingData) ? bookingData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);

    } catch (e) {
      console.error('Error fetching classes:', e);

      setActionMessage({
        type: 'error',
        text: e.response?.data?.message ||
          'Unable to load fitness classes. Please try again.'
      });

    } finally {
      setLoading(false);
    }
  };

  // Open booking confirmation dialog
  const handleBookClick = (schedule) => {
    setSelectedSchedule(schedule);
    setBookingDialogOpen(true);
  };

  // Confirm class reservation
  const handleConfirmBooking = async () => {
    if (!selectedSchedule) return;

    setBookingSubmitting(true);
    setActionMessage({ type: '', text: '' });

    try {
      const res = await api.post('/bookings', {
        schedule_id: selectedSchedule.id
      });

      setActionMessage({
        type: 'success',
        text: res.data.message ||
          'Seat reserved successfully! You can view it in My Bookings.'
      });

      setBookingDialogOpen(false);

      await fetchData();

      setTab(1);

    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message ||
          'Failed to book class. Ensure you have an active membership.'
      });

      setBookingDialogOpen(false);

    } finally {
      setBookingSubmitting(false);
    }
  };

  // Cancel a booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const res = await api.delete(`/bookings/${bookingId}`);

      setActionMessage({
        type: 'info',
        text: res.data.message || 'Booking cancelled successfully.'
      });

      await fetchData();

    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Cancellation failed.'
      });
    }
  };

  // Check in for attendance
  const handleCheckIn = async (bookingId) => {
    try {
      const res = await api.post('/attendance/check-in', {
        booking_id: bookingId
      });

      setActionMessage({
        type: 'success',
        text: res.data.message ||
          'Attendance checked in successfully!'
      });

      await fetchData();

    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message ||
          'Check-in failed. Please verify schedule time.'
      });
    }
  };

  // Filter classes by category
  const filteredSchedules = selectedCategory
    ? schedules.filter(
        (s) =>
          String(s.gym_class?.category_id) === String(selectedCategory) ||
          String(s.gym_class?.category?.id) === String(selectedCategory)
      )
    : schedules;

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
            Fitness Classes & Schedules
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
          >
            Explore daily instructor-led fitness sessions,
            reserve available slots, and check in upon arrival.
          </Typography>
        </Box>
      </Box>

      {/* FEEDBACK */}
      {actionMessage.text && (
        <Alert
          severity={actionMessage.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() =>
            setActionMessage({ type: '', text: '' })
          }
        >
          {actionMessage.text}
        </Alert>
      )}

      {/* NAVIGATION TABS */}
      <Paper sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`Available Classes (${schedules.length})`} />

          <Tab label={`My Bookings & Attendance (${bookings.length})`} />
        </Tabs>
      </Paper>

      {/* TAB 0: AVAILABLE CLASSES */}
      {tab === 0 ? (
        <Box>

          {/* CATEGORY FILTER */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Filter by Category</InputLabel>

              <Select
                value={selectedCategory}
                label="Filter by Category"
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="">
                  All Class Categories
                </MenuItem>

                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* AVAILABLE CLASS CARDS */}
          <Grid container spacing={3}>

            {filteredSchedules.length === 0 ? (
              <Grid item xs={12}>
                <Paper
                  sx={{
                    p: 5,
                    textAlign: 'center',
                    borderRadius: 3
                  }}
                >
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    gutterBottom
                  >
                    No Classes Available
                  </Typography>

                  <Typography color="text.secondary">
                    There are currently no upcoming classes in this category.
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              filteredSchedules.map((s) => {
                const gymClass = s.gym_class || {};

                const isAlreadyBooked = bookings.some(
                  (b) =>
                    String(b.schedule_id) === String(s.id) &&
                    b.status === 'confirmed'
                );

                const spotsLeft =
                  s.available_spaces !== undefined
                    ? Number(s.available_spaces)
                    : Number(s.capacity || 0) -
                      Number(s.confirmed_bookings_count || 0);

                const isFull = spotsLeft <= 0;

                return (
                  <Grid item xs={12} sm={6} md={4} key={s.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 4,
                        border: isAlreadyBooked
                          ? '2px solid #10b981'
                          : '1px solid #e2e8f0'
                      }}
                    >
                      <CardContent sx={{ p: 3, flexGrow: 1 }}>

                        {/* CATEGORY AND AVAILABILITY */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 1,
                            flexWrap: 'wrap',
                            mb: 1.5
                          }}
                        >
                          <Chip
                            label={gymClass.category?.name || 'Fitness'}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />

                          <Chip
                            label={
                              isFull
                                ? 'FULL'
                                : `${spotsLeft} Spaces Left`
                            }
                            size="small"
                            color={
                              isFull
                                ? 'error'
                                : spotsLeft <= 3
                                  ? 'warning'
                                  : 'success'
                            }
                            sx={{ fontWeight: 700 }}
                          />
                        </Box>

                        <Typography
                          variant="h6"
                          fontWeight={700}
                          gutterBottom
                        >
                          {gymClass.name || 'Fitness Class'}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ minHeight: 40, mb: 2 }}
                        >
                          {gymClass.description || 'No description available.'}
                        </Typography>

                        <Divider sx={{ my: 1.5 }} />

                        {/* CLASS INFORMATION */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: '#475569'
                            }}
                          >
                            <AccessTimeIcon />

                            <Typography variant="body2">
                              <strong>Date:</strong> {s.session_date || 'Not specified'}
                              {' '}({s.start_time || '--'} - {s.end_time || '--'})
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: '#475569'
                            }}
                          >
                            <PersonIcon />

                            <Typography variant="body2">
                              <strong>Trainer:</strong>{' '}
                              {s.trainer?.name || 'Assigned Instructor'}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              color: '#475569'
                            }}
                          >
                            <LocationOnIcon />

                            <Typography variant="body2">
                              <strong>Location:</strong>{' '}
                              {s.room_location || 'Main Fitness Studio'}
                            </Typography>
                          </Box>
                        </Box>

                      </CardContent>

                      {/* BOOKING ACTION */}
                      <Box sx={{ p: 3, pt: 0 }}>

                        {isAlreadyBooked ? (
                          <Button
                            fullWidth
                            variant="outlined"
                            color="success"
                            disabled
                            startIcon={<CheckCircleOutlineIcon />}
                          >
                            Seat Reserved
                          </Button>
                        ) : (
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={isFull}
                            onClick={() => handleBookClick(s)}
                          >
                            {isFull ? 'Class Full' : 'Reserve Spot'}
                          </Button>
                        )}

                      </Box>
                    </Card>
                  </Grid>
                );
              })
            )}

          </Grid>
        </Box>

      ) : (

        /* TAB 1: MY BOOKINGS AND ATTENDANCE */
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3 }}
        >
          <Table sx={{ minWidth: 850 }}>

            <TableHead>
              <TableRow>
                <TableCell><strong>Class Name</strong></TableCell>
                <TableCell><strong>Schedule & Time</strong></TableCell>
                <TableCell><strong>Trainer</strong></TableCell>
                <TableCell><strong>Booking Status</strong></TableCell>
                <TableCell><strong>Attendance</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>

              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{
                      py: 4,
                      color: 'text.secondary'
                    }}
                  >
                    You have no active class reservations.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((b) => {
                  const schedule = b.schedule || {};
                  const isCheckedIn = !!b.attendance;

                  return (
                    <TableRow key={b.id} hover>

                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {schedule.gym_class?.name || 'Gym Class'}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Ref: #{b.id}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {schedule.session_date || 'Not specified'}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {schedule.start_time || '--'} - {schedule.end_time || '--'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {schedule.trainer?.name || 'Assigned Instructor'}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={(b.status || 'pending').toUpperCase()}
                          size="small"
                          color={
                            b.status === 'confirmed'
                              ? 'primary'
                              : 'default'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={
                            isCheckedIn
                              ? 'CHECKED IN'
                              : 'NOT CHECKED IN'
                          }
                          size="small"
                          color={isCheckedIn ? 'success' : 'warning'}
                          sx={{ fontWeight: 700 }}
                        />
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
                          {!isCheckedIn && b.status === 'confirmed' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleCheckIn(b.id)}
                            >
                              Check In
                            </Button>
                          )}

                          {b.status === 'confirmed' && !isCheckedIn && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleCancelBooking(b.id)}
                              startIcon={<CancelOutlinedIcon />}
                            >
                              Cancel
                            </Button>
                          )}
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

      {/* BOOKING CONFIRMATION DIALOG */}
      <Dialog
        open={bookingDialogOpen}
        onClose={() => {
          if (!bookingSubmitting) {
            setBookingDialogOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Class Reservation
        </DialogTitle>

        <DialogContent dividers>

          <Typography variant="body2" gutterBottom>
            You are reserving a slot in:
          </Typography>

          <Typography
            variant="h6"
            color="primary"
            fontWeight={700}
            gutterBottom
          >
            {selectedSchedule?.gym_class?.name || 'Fitness Class'}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            <strong>Date:</strong> {selectedSchedule?.session_date || 'Not specified'}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1 }}
          >
            <strong>Time:</strong> {selectedSchedule?.start_time || '--'} - {selectedSchedule?.end_time || '--'}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            <strong>Instructor:</strong>{' '}
            {selectedSchedule?.trainer?.name || 'Assigned Instructor'}
          </Typography>

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>

          <Button
            onClick={() => setBookingDialogOpen(false)}
            color="inherit"
            disabled={bookingSubmitting}
          >
            Dismiss
          </Button>

          <Button
            onClick={handleConfirmBooking}
            variant="contained"
            color="primary"
            disabled={bookingSubmitting}
            startIcon={
              bookingSubmitting
                ? <CircularProgress size={18} color="inherit" />
                : <CheckCircleOutlineIcon />
            }
          >
            {bookingSubmitting ? 'Reserving...' : 'Confirm Booking'}
          </Button>

        </DialogActions>
      </Dialog>

    </Box>
  );
}
