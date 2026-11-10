import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Paper,
  CircularProgress
} from '@mui/material';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChatIcon from '@mui/icons-material/Chat';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function MemberDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [latestMetric, setLatestMetric] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState({ total_checkins: 0, attendance_rate: '0%' });
  const [checkinMessage, setCheckinMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [memRes, bookRes, workRes, metricRes, attRes] = await Promise.allSettled([
        api.get('/memberships'),
        api.get('/bookings'),
        api.get('/workout-plans'),
        api.get('/fitness-metrics'),
        api.get('/attendance/stats'),
      ]);

      if (memRes.status === 'fulfilled') {
        const mems = memRes.value.data.memberships || memRes.value.data.data || memRes.value.data || [];
        const active = mems.find(m => m.status === 'active') || mems[0];
        setMembership(active);
      }
      if (bookRes.status === 'fulfilled') {
        const books = bookRes.value.data.bookings || bookRes.value.data.data || bookRes.value.data || [];
        setUpcomingBookings(books.filter(b => b.status === 'confirmed').slice(0, 3));
      }
      if (workRes.status === 'fulfilled') {
        const plans = workRes.value.data.plans || workRes.value.data.data || workRes.value.data || [];
        setWorkoutPlans(plans.slice(0, 2));
      }
      if (metricRes.status === 'fulfilled') {
        const metrics = metricRes.value.data.metrics || metricRes.value.data.data || metricRes.value.data || [];
        if (metrics.length > 0) {
          setLatestMetric(metrics[0]);
        }
      }
      if (attRes.status === 'fulfilled') {
        setAttendanceStats(attRes.value.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfCheckin = async (bookingId) => {
    try {
      const res = await api.post('/attendance/check-in', { booking_id: bookingId });
      setCheckinMessage(res.data.message || 'Attendance checked in successfully!');
      fetchDashboardData();
    } catch (err) {
      setCheckinMessage(err.response?.data?.message || 'Check-in failed. Please verify schedule time.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const assignedTrainer = user?.member_profile?.assigned_trainer;
  const isMembershipActive = membership && membership.status === 'active';

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            Welcome back, {user?.name?.split(' ')[0]}! 💪
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here is your daily fitness progress, workout schedule, and membership status.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<EventAvailableIcon />}
            onClick={() => navigate('/member/classes')}
          >
            Book a Class
          </Button>
          <Button
            variant="contained"
            startIcon={<FitnessCenterIcon />}
            onClick={() => navigate('/member/workouts')}
          >
            My Workout Plans
          </Button>
        </Box>
      </Box>

      {/* Expiry Warning / Non-active Alert */}
      {!isMembershipActive && (
        <Alert
          severity="warning"
          sx={{ mb: 4, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/member/memberships')}>
              Renew / Subscribe Now
            </Button>
          }
        >
          <strong>No Active Subscription:</strong> You currently don't have an active gym subscription. Please subscribe to book classes and access personal training facilities.
        </Alert>
      )}

      {checkinMessage && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }} onClose={() => setCheckinMessage('')}>
          {checkinMessage}
        </Alert>
      )}

      {/* KPI Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Membership Status"
            value={membership ? membership.status.toUpperCase() : 'NO PLAN'}
            subtitle={
              membership?.end_date
                ? `Expires: ${new Date(membership.end_date).toLocaleDateString()}`
                : 'Select package to start'
            }
            icon={<CardMembershipIcon />}
            color={isMembershipActive ? '#10b981' : '#f59e0b'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Bookings"
            value={upcomingBookings.length}
            subtitle="Scheduled class sessions"
            icon={<EventAvailableIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Gym Attendance"
            value={attendanceStats.total_checkins || 0}
            subtitle={`Attendance Rate: ${attendanceStats.attendance_rate || 'N/A'}`}
            icon={<HowToRegIcon />}
            color="#06b6d4"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Latest Weight"
            value={latestMetric ? `${latestMetric.weight} kg` : 'N/A'}
            subtitle={latestMetric?.bmi ? `BMI: ${latestMetric.bmi} (${latestMetric.bmi_category || 'Normal'})` : 'No logs yet'}
            icon={<ShowChartIcon />}
            color="#8b5cf6"
          />
        </Grid>
      </Grid>

      {/* Main Section: 2 Columns */}
      <Grid container spacing={4}>
        {/* Left Column: Upcoming Classes & Workouts */}
        <Grid item xs={12} md={7}>
          {/* Upcoming Class Bookings */}
          <Card sx={{ mb: 4, borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Upcoming Class Bookings
                </Typography>
                <Button size="small" onClick={() => navigate('/member/classes')}>
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {upcomingBookings.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    You have no upcoming class bookings.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                    onClick={() => navigate('/member/classes')}
                  >
                    Browse Class Schedule
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {upcomingBookings.map((b) => (
                    <ListItem
                      key={b.id}
                      sx={{
                        p: 2,
                        mb: 1.5,
                        borderRadius: 3,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 1
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {b.schedule?.gym_class?.name || 'Fitness Class'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Trainer: {b.schedule?.trainer?.name || 'Assigned Instructor'} | Session Date: {b.schedule?.class_date} ({b.schedule?.start_time} - {b.schedule?.end_time})
                        </Typography>
                        <Chip
                          label={b.attendance ? 'Checked In' : 'Confirmed'}
                          size="small"
                          color={b.attendance ? 'success' : 'primary'}
                          sx={{ mt: 0.5, fontWeight: 600, fontSize: '0.68rem' }}
                        />
                      </Box>
                      {!b.attendance && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleSelfCheckin(b.id)}
                        >
                          Check In Now
                        </Button>
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Assigned Workout Routines */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Assigned Workout Plans
                </Typography>
                <Button size="small" onClick={() => navigate('/member/workouts')}>
                  View Workouts
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {workoutPlans.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No workout plan assigned yet. Your coach will design one based on your goals.
                  </Typography>
                </Box>
              ) : (
                workoutPlans.map((wp) => (
                  <Paper key={wp.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {wp.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {wp.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip label={`Goal: ${wp.goal || 'General Fitness'}`} size="small" variant="outlined" />
                      <Chip label={`Level: ${wp.difficulty_level || 'Intermediate'}`} size="small" color="secondary" variant="outlined" />
                    </Box>
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Assigned Trainer Card & Fitness Goals */}
        <Grid item xs={12} md={5}>
          {/* Assigned Trainer Card */}
          <Card sx={{ mb: 4, borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Personal Coach & Trainer
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {assignedTrainer ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Avatar
                    sx={{ width: 72, height: 72, mx: 'auto', mb: 1.5, bgcolor: 'secondary.main', fontSize: '1.75rem' }}
                  >
                    {assignedTrainer.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {assignedTrainer.name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600} gutterBottom>
                    {assignedTrainer.trainer_profile?.specialization || 'Certified Strength & Conditioning Coach'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {assignedTrainer.trainer_profile?.bio || 'Available for personal coaching and customized routine adjustments.'}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<ChatIcon />}
                    onClick={() => navigate('/messages')}
                  >
                    Message Trainer
                  </Button>
                </Box>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No dedicated trainer assigned yet. Gym administration assigns certified trainers based on your goals.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Quick Profile & Fitness Goals */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Fitness Goals & Profile
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">PRIMARY GOALS</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {user?.member_profile?.fitness_goals || 'Not specified yet'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block">HEALTH NOTES / INJURIES</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {user?.member_profile?.health_notes || 'None reported'}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" display="block">EMERGENCY CONTACT</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {user?.member_profile?.emergency_contact_name || 'N/A'} ({user?.member_profile?.emergency_contact_relation || 'Relation'}) - {user?.member_profile?.emergency_contact_phone || 'N/A'}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/profile')}
              >
                Update Profile & Health Info
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
