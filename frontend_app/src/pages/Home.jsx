import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Divider,
  Paper,
  Avatar
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    // Fetch public packages, classes, and trainers
    const fetchPublicData = async () => {
      try {
        const [plansRes, classesRes, trainersRes] = await Promise.all([
          api.get('/membership-plans'),
          api.get('/classes'),
          api.get('/trainers'),
        ]);
        setPlans(plansRes.data.data || plansRes.data || []);
        setClasses(classesRes.data.data || classesRes.data || []);
        setTrainers(trainersRes.data.data || trainersRes.data || []);
      } catch (e) {
        console.error('Failed to load public data', e);
      }
    };
    fetchPublicData();
  }, []);

  return (
    <Box sx={{ bgcolor: '#ffffff', minHeight: '100vh' }}>
      {/* Public Navigation */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', px: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <FitnessCenterIcon />
              </Box>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                ApexFit Gym
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {user ? (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/${user.role}/dashboard`)}
                  endIcon={<ArrowForwardIcon />}
                >
                  Go to Dashboard ({user.role})
                </Button>
              ) : (
                <>
                  <Button variant="text" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button variant="contained" onClick={() => navigate('/register')}>
                    Join Now
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          pt: { xs: 8, md: 12 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="TVET LEVEL 7 ITLAW701 ASSESSED PLATFORM"
                color="secondary"
                size="small"
                sx={{ mb: 2, fontWeight: 700, letterSpacing: 0.5 }}
              />
              <Typography variant="h2" fontWeight={800} sx={{ mb: 2, lineHeight: 1.15 }}>
                Elevate Your Fitness & Health with Modern Technology
              </Typography>
              <Typography variant="h6" sx={{ color: '#94a3b8', mb: 4, fontWeight: 400, maxWidth: 540 }}>
                Manage gym memberships, book live classes with certified trainers, track personal workout metrics, and achieve your peak physical condition seamlessly.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{ py: 1.5, px: 3, fontSize: '1rem' }}
                >
                  Start Your Journey
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    const el = document.getElementById('plans-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  sx={{ color: '#ffffff', borderColor: '#475569', py: 1.5, px: 3 }}
                >
                  View Membership Plans
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper
                elevation={6}
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 4,
                  color: '#ffffff',
                }}
              >
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🔥 Why Train at ApexFit?
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText primary="Personalized structured workout plans from expert coaches" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText primary="Automated attendance checking & class seat reservation" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText primary="Dynamic fitness charts for BMI, body weight, and strength" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CheckCircleIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText primary="Direct private messaging with your assigned trainer" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Membership Packages Section */}
      <Box id="plans-section" sx={{ py: 10, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1}>
              FLEXIBLE SUBSCRIPTIONS
            </Typography>
            <Typography variant="h3" fontWeight={800} color="#0f172a">
              Choose the Perfect Membership Package
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 600, mx: 'auto' }}>
              Transparent pricing with no hidden fees. All packages include access to equipment, locker rooms, and mobile self check-in.
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            {plans.map((p) => {
              const benefits = Array.isArray(p.benefits) ? p.benefits : [];
              return (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      position: 'relative',
                      border: p.name?.toLowerCase().includes('gold') || p.name?.toLowerCase().includes('vip')
                        ? '2px solid #2563eb'
                        : '1px solid #e2e8f0',
                    }}
                  >
                    <CardContent sx={{ p: 4, flexGrow: 1 }}>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {p.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 2 }}>
                        {p.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                        <Typography variant="h3" fontWeight={800} color="primary">
                          ${p.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          / {p.duration_days} Days
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Package Benefits:
                      </Typography>
                      <List dense sx={{ mb: 3 }}>
                        {benefits.map((b, i) => (
                          <ListItem key={i} disableGutters>
                            <ListItemIcon sx={{ minWidth: 28 }}>
                              <CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} />
                            </ListItemIcon>
                            <ListItemText primary={b} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    <Box sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => navigate('/login')}
                      >
                        Subscribe Now
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* Featured Classes Section */}
      <Box sx={{ py: 10, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1}>
              GROUP FITNESS & WELLNESS
            </Typography>
            <Typography variant="h3" fontWeight={800} color="#0f172a">
              Explore Popular Fitness Classes
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 600, mx: 'auto' }}>
              Led by certified instructors with limited capacity to ensure personalized coaching and safety.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {classes.slice(0, 3).map((c) => (
              <Grid item xs={12} md={4} key={c.id}>
                <Card sx={{ height: '100%', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Chip label={c.category?.name || 'Fitness'} size="small" color="primary" variant="outlined" />
                      <Typography variant="caption" color="text.secondary">
                        Max: {c.capacity} members
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {c.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {c.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b' }}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="caption" fontWeight={600}>
                        Duration: {c.duration_minutes} minutes
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Certified Trainers Showcase */}
      <Box sx={{ py: 10, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1}>
              EXPERT COACHING
            </Typography>
            <Typography variant="h3" fontWeight={800} color="#0f172a">
              Meet Our Certified Personal Trainers
            </Typography>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {trainers.map((t) => (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Card sx={{ textAlign: 'center', p: 3, borderRadius: 4 }}>
                  <Avatar
                    sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '1.75rem' }}
                  >
                    {t.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {t.name}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight={600} gutterBottom>
                    {t.trainer_profile?.specialization || 'Fitness & Conditioning Coach'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                    {t.trainer_profile?.bio || 'Dedicated to helping members achieve their strength, posture, and wellness goals.'}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="space-between">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <FitnessCenterIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>ApexFit Sports & Gym</Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Integrated digital platform for gym membership, class scheduling, trainer allocation, and fitness tracking.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                ACADEMIC ACCREDITATION
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                Module: ITLAW701 – Advanced Web Technologies
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                TVET Certificate VII in Information Technology
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                Training Centre: RP Karongi College
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 4, borderColor: '#1e293b' }} />
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center' }}>
            © {new Date().getFullYear()} ApexFit Gym Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
