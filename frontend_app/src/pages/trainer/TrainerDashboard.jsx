import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  CircularProgress
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainerData();
  }, []);

  const fetchTrainerData = async () => {
    setLoading(true);
    try {
      const [memRes, schedRes] = await Promise.allSettled([
        api.get('/trainer/assigned-members'),
        api.get('/schedules?upcoming=true'),
      ]);

      if (memRes.status === 'fulfilled') {
        setAssignedMembers(memRes.value.data || []);
      }
      if (schedRes.status === 'fulfilled') {
        const allSched = schedRes.value.data.data || schedRes.value.data || [];
        setSchedules(allSched.filter(s => s.trainer_id === user?.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
            Trainer Coach Hub: {user?.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your personal training roster, design workout routines, and track class attendance.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/trainer/workout-builder')}
          >
            Create Workout Plan
          </Button>
          <Button
            variant="outlined"
            startIcon={<HowToRegIcon />}
            onClick={() => navigate('/trainer/attendance')}
          >
            Mark Class Attendance
          </Button>
        </Box>
      </Box>

      {/* KPI Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Members"
            value={assignedMembers.length}
            subtitle="Clients under your coaching"
            icon={<PeopleAltIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Classes"
            value={schedules.length}
            subtitle="Scheduled sessions to lead"
            icon={<FitnessCenterIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Specialization"
            value={user?.trainer_profile?.specialization || 'Strength & Conditioning'}
            subtitle="Coach category"
            icon={<AssignmentIcon />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Availability"
            value={(user?.trainer_profile?.availability_status || 'available').toUpperCase()}
            subtitle="Booking status"
            icon={<HowToRegIcon />}
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      {/* Main Grid: Assigned Members & Class Schedule */}
      <Grid container spacing={4}>
        {/* Left Column: Assigned Member Roster */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4, mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  My Assigned Clients & Members
                </Typography>
                <Button size="small" onClick={() => navigate('/trainer/members')}>
                  View All Roster
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {assignedMembers.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No members currently allocated. Gym administration assigns members based on fitness requirements.
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {assignedMembers.slice(0, 5).map((m) => (
                    <ListItem
                      key={m.id}
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
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700 }}>
                          {m.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {m.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Goals: {m.member_profile?.fitness_goals || 'General conditioning'}
                          </Typography>
                          {m.member_profile?.health_notes && (
                            <Chip
                              label={`Note: ${m.member_profile.health_notes}`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ mt: 0.5, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ChatIcon />}
                          onClick={() => navigate('/messages')}
                        >
                          Chat
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AssignmentIcon />}
                          onClick={() => navigate('/trainer/workout-builder')}
                        >
                          Assign Plan
                        </Button>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Classes to Instruct */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  My Instructing Schedule
                </Typography>
                <Button size="small" onClick={() => navigate('/trainer/attendance')}>
                  Mark Attendance
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {schedules.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    You have no scheduled group classes for the current week.
                  </Typography>
                </Box>
              ) : (
                schedules.map((s) => (
                  <Paper key={s.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {s.gym_class?.name}
                      </Typography>
                      <Chip label={`${s.confirmed_bookings_count || 0}/${s.capacity} Booked`} size="small" color="primary" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Date: {s.session_date} ({s.start_time} - {s.end_time})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Studio: {s.room_location || 'Main Gym Room'}
                    </Typography>
                  </Paper>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
