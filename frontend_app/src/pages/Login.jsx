import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Chip,
  CircularProgress,
  Container,
  Paper
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'trainer') {
        navigate('/trainer/dashboard');
      } else {
        navigate('/member/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        'Invalid email or password. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        py: 4,
        background: 'radial-gradient(circle at top right, #e2e8f0, #f8fafc)',
      }}
    >
      <Container maxWidth="sm">
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
                width: 50,
                height: 50,
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
              ApexFit Gym Management
            </Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd' }}>
              Sign in to access your membership, workouts, or administrative console
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                placeholder="e.g. member.alice@apexfit.com"
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <TextField
                label="Password"
                type="password"
                fullWidth
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                placeholder="Enter password"
                InputProps={{ sx: { borderRadius: 2 } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <RouterLink to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Register as a New Member
                </RouterLink>
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Chip label="Quick Demo Login Accounts" size="small" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
            </Divider>

            {/* Quick Demo Fill Buttons for Examiners */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => setDemoCredentials('admin@apexfit.com')}
                sx={{ justifyContent: 'flex-start', py: 0.8 }}
              >
                <strong>Admin:</strong>&nbsp;admin@apexfit.com (Password: password123)
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => setDemoCredentials('trainer.john@apexfit.com')}
                sx={{ justifyContent: 'flex-start', py: 0.8 }}
              >
                <strong>Trainer:</strong>&nbsp;trainer.john@apexfit.com (Password: password123)
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={() => setDemoCredentials('member.alice@apexfit.com')}
                sx={{ justifyContent: 'flex-start', py: 0.8 }}
              >
                <strong>Member:</strong>&nbsp;member.alice@apexfit.com (Password: password123)
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
