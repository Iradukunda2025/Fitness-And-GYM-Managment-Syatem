
import React, { useState } from 'react';

import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';

import DownloadIcon from '@mui/icons-material/Download';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';

import api from '../../api/axios';

export default function Reports() {
  const [downloading, setDownloading] = useState({
    members: false,
    attendance: false,
    payments: false
  });

  const [feedback, setFeedback] = useState({
    type: '',
    text: ''
  });

  const handleDownloadCsv = async (endpoint, filename, key) => {
    setDownloading((prev) => ({
      ...prev,
      [key]: true
    }));

    setFeedback({ type: '', text: '' });

    try {
      const res = await api.get(endpoint, {
        responseType: 'blob'
      });

      // Create download anchor
      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        text: `Successfully downloaded ${filename}`
      });

    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Failed to download report. Check permissions.'
      });

    } finally {
      setDownloading((prev) => ({
        ...prev,
        [key]: false
      }));
    }
  };

  return (
    <Box>

      {/* Page Header */}
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
          <Typography variant="h4" fontWeight={800} color="#0f172a">
            System Data & Analytics Reports
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Generate and export official administrative CSV reports for
            external audits, institutional assessments, and board meetings.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
        >
          Print Executive Summary
        </Button>
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

      {/* Export Cards */}
      <Grid container spacing={4} sx={{ mb: 4 }}>

        {/* Members Report */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <PeopleAltIcon color="primary" sx={{ fontSize: 32 }} />

                <Typography variant="h6" fontWeight={700}>
                  Members Registry
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Comprehensive list of registered members, contact information,
                subscription packages, and emergency contacts.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Member ID, Name, Email & Phone" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Current Active Subscription Plan" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Expiry Date & Emergency Contact" />
                </ListItem>
              </List>
            </CardContent>

            <Box sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={
                  downloading.members
                    ? <CircularProgress size={18} color="inherit" />
                    : <DownloadIcon />
                }
                disabled={downloading.members}
                onClick={() =>
                  handleDownloadCsv(
                    '/reports/export/members',
                    `apexfit_members_${new Date().toISOString().split('T')[0]}.csv`,
                    'members'
                  )
                }
              >
                {downloading.members
                  ? 'Generating CSV...'
                  : 'Download Members CSV'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Attendance Report */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <HowToRegIcon color="success" sx={{ fontSize: 32 }} />

                <Typography variant="h6" fontWeight={700}>
                  Attendance Logs
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Complete logs of class sessions, attendee check-in timestamps,
                status (present/late/absent), and instructor verification.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Session Dates & Times" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Class Title & Category" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Check-In Verification Mechanism" />
                </ListItem>
              </List>
            </CardContent>

            <Box sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={
                  downloading.attendance
                    ? <CircularProgress size={18} color="inherit" />
                    : <DownloadIcon />
                }
                disabled={downloading.attendance}
                onClick={() =>
                  handleDownloadCsv(
                    '/reports/export/attendance',
                    `apexfit_attendance_${new Date().toISOString().split('T')[0]}.csv`,
                    'attendance'
                  )
                }
              >
                {downloading.attendance
                  ? 'Generating CSV...'
                  : 'Download Attendance CSV'}
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Financial Revenue Report */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <CardContent sx={{ p: 4, flexGrow: 1 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2
                }}
              >
                <AttachMoneyIcon color="warning" sx={{ fontSize: 32 }} />

                <Typography variant="h6" fontWeight={700}>
                  Revenue & Payments
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Audit of all simulated transactions, invoices, and payment
                references for financial compliance and accounting.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <List dense>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Unique Payment Reference IDs" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Subscription Amounts & Methods" />
                </ListItem>

                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Invoice & Receipt Timestamps" />
                </ListItem>
              </List>
            </CardContent>

            <Box sx={{ p: 3, pt: 0 }}>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                startIcon={
                  downloading.payments
                    ? <CircularProgress size={18} color="inherit" />
                    : <DownloadIcon />
                }
                disabled={downloading.payments}
                onClick={() =>
                  handleDownloadCsv(
                    '/reports/export/payments',
                    `apexfit_payments_${new Date().toISOString().split('T')[0]}.csv`,
                    'payments'
                  )
                }
              >
                {downloading.payments
                  ? 'Generating CSV...'
                  : 'Download Payments CSV'}
              </Button>
            </Box>
          </Card>
        </Grid>

      </Grid>

      {/* Institutional Assessment Note Card */}
      <Card
        sx={{
          borderRadius: 4,
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Institutional Academic Accreditation Summary
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This platform was engineered in compliance with TVET Certificate
            VII in Information Technology, Module ITLAW701 – Advanced Web
            Technologies, RP Karongi College.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                SECTOR & SUB-SECTOR
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                ICT / Information Technology (IT)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                CERTIFICATE & LEVEL
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                TVET Certificate VII / Level 7 IT (Year 3)
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                TRAINER / ASSESSOR
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                SAFARI Cyprien
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

    </Box>
  );
}
