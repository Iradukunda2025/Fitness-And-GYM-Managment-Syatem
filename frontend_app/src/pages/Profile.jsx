import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  MenuItem,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockResetIcon from '@mui/icons-material/LockReset';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Profile Form Data
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    gender: user?.member_profile?.gender || 'male',
    date_of_birth: user?.member_profile?.date_of_birth || '',
    address: user?.member_profile?.address || '',
    emergency_contact_name: user?.member_profile?.emergency_contact_name || '',
    emergency_contact_phone: user?.member_profile?.emergency_contact_phone || '',
    emergency_contact_relation: user?.member_profile?.emergency_contact_relation || '',
    fitness_goals: user?.member_profile?.fitness_goals || '',
    health_notes: user?.member_profile?.health_notes || '',
    // Trainer fields
    bio: user?.trainer_profile?.bio || '',
    specialties: user?.trainer_profile?.specialties || '',
    years_of_experience: user?.trainer_profile?.years_of_experience || 0,
    qualifications: user?.trainer_profile?.qualifications || '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.member_profile?.gender || 'male',
        date_of_birth: user.member_profile?.date_of_birth || '',
        address: user.member_profile?.address || '',
        emergency_contact_name: user.member_profile?.emergency_contact_name || '',
        emergency_contact_phone: user.member_profile?.emergency_contact_phone || '',
        emergency_contact_relation: user.member_profile?.emergency_contact_relation || '',
        fitness_goals: user.member_profile?.fitness_goals || '',
        health_notes: user.member_profile?.health_notes || '',
        bio: user.trainer_profile?.bio || '',
        specialties: user.trainer_profile?.specialties || '',
        years_of_experience: user.trainer_profile?.years_of_experience || 0,
        qualifications: user.trainer_profile?.qualifications || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.put('/profile', formData);
      setFeedback({ type: 'success', text: res.data.message || 'Profile updated successfully!' });
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('avatar', file);

    try {
      await api.post('/profile/avatar', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', text: 'Avatar uploaded successfully!' });
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to upload photo.' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      setFeedback({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSubmitting(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.put('/password', passwordData);
      setFeedback({ type: 'success', text: res.data.message || 'Password changed successfully!' });
      setPasswordData({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f172a">
          User Account & Fitness Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your personal identity, contact details, emergency information, and security credentials.
        </Typography>
      </Box>

      {feedback.text && (
        <Alert
          severity={feedback.type}
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setFeedback({ type: '', text: '' })}
        >
          {feedback.text}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column: Avatar & Basic Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, textAlign: 'center', p: 3, mb: 4 }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Avatar
                sx={{ width: 110, height: 110, mx: 'auto', bgcolor: 'primary.main', fontSize: '2.5rem' }}
                src={user?.avatar ? `/storage/${user.avatar}` : undefined}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <label htmlFor="avatar-upload">
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <Button
                  component="span"
                  size="small"
                  variant="contained"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    minWidth: 32,
                    width: 32,
                    height: 32,
                    p: 0,
                    borderRadius: '50%',
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </Button>
              </label>
            </Box>

            <Typography variant="h6" fontWeight={700}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ px: 1.5, py: 0.5, bgcolor: 'primary.light', color: '#fff', borderRadius: 2, fontWeight: 700 }}>
                {user?.role?.toUpperCase()}
              </Typography>
            </Box>
          </Card>

          {/* Change Password Card */}
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockResetIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>
                  Change Password
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <form onSubmit={handlePasswordSubmit}>
                <TextField
                  label="Current Password"
                  type="password"
                  fullWidth
                  required
                  size="small"
                  margin="normal"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                />
                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  size="small"
                  margin="normal"
                  value={passwordData.password}
                  onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                />
                <TextField
                  label="Confirm New Password"
                  type="password"
                  fullWidth
                  required
                  size="small"
                  margin="normal"
                  value={passwordData.password_confirmation}
                  onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 2 }}
                  disabled={passwordSubmitting}
                >
                  {passwordSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Profile Form Details */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <form onSubmit={handleProfileSubmit}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Personal & Contact Details
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Name"
                      fullWidth
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Gender"
                      fullWidth
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address"
                      fullWidth
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </Grid>
                </Grid>

                {user?.role === 'member' && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Emergency Contact Information
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Contact Name"
                          fullWidth
                          value={formData.emergency_contact_name}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Contact Phone"
                          fullWidth
                          value={formData.emergency_contact_phone}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Relationship"
                          fullWidth
                          value={formData.emergency_contact_relation}
                          onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Fitness Goals & Health Notes
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12}>
                        <TextField
                          label="Fitness Goals"
                          fullWidth
                          multiline
                          rows={2}
                          value={formData.fitness_goals}
                          onChange={(e) => setFormData({ ...formData, fitness_goals: e.target.value })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Medical / Physical Health Notes"
                          fullWidth
                          multiline
                          rows={2}
                          value={formData.health_notes}
                          onChange={(e) => setFormData({ ...formData, health_notes: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}

                {user?.role === 'trainer' && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Trainer Professional Credentials
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          label="Specialties"
                          fullWidth
                          value={formData.specialties}
                          onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                          placeholder="e.g. HIIT, Powerlifting, Yoga, Bodybuilding"
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          label="Years of Experience"
                          type="number"
                          fullWidth
                          value={formData.years_of_experience}
                          onChange={(e) => setFormData({ ...formData, years_of_experience: parseInt(e.target.value) || 0 })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Bio & Philosophy"
                          fullWidth
                          multiline
                          rows={3}
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                      </Grid>
                    </Grid>
                  </>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={<SaveIcon />}
                  >
                    {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
