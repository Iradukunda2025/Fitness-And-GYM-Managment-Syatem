import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  MenuItem,
  CircularProgress,
  Container,
  Divider,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    gender: 'male',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    fitness_goals: '',
    health_notes: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      navigate('/member/dashboard');
    } catch (err) {
      const errRes = err.response?.data;
      if (errRes?.errors) {
        const firstErrorKey = Object.keys(errRes.errors)[0];
        setError(errRes.errors[firstErrorKey][0]);
      } else {
        setError(errRes?.message || 'Registration failed. Please check inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f1f5f9',
        py: 6,
        background: 'radial-gradient(circle at top right, #e2e8f0, #f8fafc)',
      }}
    >
      <Container maxWidth="md">
        <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: '#fff',
              p: 3,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1,
              }}
            >
              <FitnessCenterIcon fontSize="medium" />
            </Box>
            <Typography variant="h5" fontWeight={800}>
              Member Registration
            </Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd' }}>
              Create your profile to access gym facilities, classes, and personalized coaching
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                1. Account & Personal Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    name="name"
                    required
                    fullWidth
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jean de Dieu"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    fullWidth
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    name="phone"
                    required
                    fullWidth
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+250 788 000 000"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    label="Gender"
                    name="gender"
                    fullWidth
                    value={formData.gender}
                    onChange={handleChange}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={formData.date_of_birth}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Residential Address / City"
                    name="address"
                    fullWidth
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. Karongi Campus / Kigali"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    required
                    fullWidth
                    value={formData.password}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Confirm Password"
                    name="password_confirmation"
                    type="password"
                    required
                    fullWidth
                    value={formData.password_confirmation}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                2. Emergency Contact Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Contact Name"
                    name="emergency_contact_name"
                    fullWidth
                    value={formData.emergency_contact_name}
                    onChange={handleChange}
                    placeholder="Family member or friend"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Contact Phone"
                    name="emergency_contact_phone"
                    fullWidth
                    value={formData.emergency_contact_phone}
                    onChange={handleChange}
                    placeholder="+250 788 111 222"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Relationship"
                    name="emergency_contact_relation"
                    fullWidth
                    value={formData.emergency_contact_relation}
                    onChange={handleChange}
                    placeholder="e.g. Spouse, Brother, Parent"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                3. Fitness Goals & Health Notes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Primary Fitness Goals"
                    name="fitness_goals"
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.fitness_goals}
                    onChange={handleChange}
                    placeholder="e.g. Weight loss, muscle building, marathon endurance..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Health & Medical Notes"
                    name="health_notes"
                    multiline
                    rows={3}
                    fullWidth
                    value={formData.health_notes}
                    onChange={handleChange}
                    placeholder="e.g. Lower back stiffness, asthma, knee surgery history..."
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 4, py: 1.5, fontSize: '1rem' }}
                startIcon={<HowToRegIcon />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Complete Registration'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Already registered?{' '}
                  <RouterLink to="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                    Sign in to your account
                  </RouterLink>
                </Typography>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
