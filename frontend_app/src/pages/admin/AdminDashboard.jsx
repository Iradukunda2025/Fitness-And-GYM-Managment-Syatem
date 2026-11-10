import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SecurityIcon from '@mui/icons-material/Security';
import StatCard from '../../components/StatCard';
import api from '../../api/axios';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
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
            Executive Operations Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            High-level metrics on membership subscriptions, collected gym revenue, facility attendance, and trainer allocations.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<SecurityIcon />}
            onClick={() => navigate('/admin/fraud-audit')}
          >
            Fraud & Audit
          </Button>
          <Button
            variant="contained"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/admin/reports')}
          >
            Export Reports (CSV)
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Registered Members"
            value={stats.totalMembers || 0}
            subtitle={`${stats.totalTrainers || 0} Certified Trainers`}
            icon={<PeopleAltIcon />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Subscriptions"
            value={stats.activeMemberships || 0}
            subtitle={`${stats.expiredMemberships || 0} Expired Subscriptions`}
            icon={<CardMembershipIcon />}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Collected Revenue"
            value={`$${parseFloat(stats.totalRevenue || 0).toLocaleString()}`}
            subtitle={`$${parseFloat(stats.thisMonthRevenue || 0).toLocaleString()} this month`}
            icon={<AttachMoneyIcon />}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Attendance Check-Ins"
            value={stats.totalAttendance || 0}
            subtitle={`${stats.totalBookings || 0} Lifetime Class Reservations`}
            icon={<HowToRegIcon />}
            color="#06b6d4"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Revenue Trends Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Monthly Revenue Collection ($ USD)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Financial trends across recent operational months
              </Typography>
              <Box sx={{ width: '100%', height: 320, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.revenueTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#2563eb" />
                    <Tooltip />
                    <Bar dataKey="revenue" name="Revenue ($)" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Membership Package Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Active Membership Distribution
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Subscriber share across membership packages
              </Typography>
              <Box sx={{ width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.membershipDistribution || []}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {(stats.membershipDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Attendance Pattern Chart & Quick Links */}
      <Grid container spacing={3}>
        {/* Attendance by Day */}
        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Weekly Attendance & Facility Footfall Pattern
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Daily check-in distribution showing peak workout days
              </Typography>
              <Box sx={{ width: '100%', height: 260, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.attendanceTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#64748b" />
                    <YAxis stroke="#10b981" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      name="Check-Ins"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Administrative Management Cards */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 4, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Administration Portals
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                  onClick={() => navigate('/admin/users')}
                >
                  👥 Manage Members & Assign Trainers
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                  onClick={() => navigate('/admin/plans')}
                >
                  💳 Configure Membership Packages & Prices
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                  onClick={() => navigate('/admin/classes')}
                >
                  📅 Class Categories, Schedules & Trainers
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                  onClick={() => navigate('/admin/financials')}
                >
                  💵 Revenue Ledger, Invoices & Payment Simulator
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', py: 1.2 }}
                  onClick={() => navigate('/admin/fraud-audit')}
                >
                  🛡️ Security Audit Logs & Fraud Monitoring
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
