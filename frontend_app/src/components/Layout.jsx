import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
  useMediaQuery,
  useTheme,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SecurityIcon from '@mui/icons-material/Security';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CategoryIcon from '@mui/icons-material/Category';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    navigate('/login');
  };

  // Build navigation items based on user role
  const getNavItems = () => {
    if (role === 'admin') {
      return [
        { title: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
        { title: 'User Management', path: '/admin/users', icon: <PeopleAltIcon /> },
        { title: 'Membership Plans', path: '/admin/plans', icon: <CardMembershipIcon /> },
        { title: 'Classes & Schedules', path: '/admin/classes', icon: <CategoryIcon /> },
        { title: 'Financials & Revenue', path: '/admin/financials', icon: <ReceiptLongIcon /> },
        { title: 'Fraud & Audit Logs', path: '/admin/fraud-audit', icon: <SecurityIcon /> },
        { title: 'System Reports', path: '/admin/reports', icon: <AssessmentIcon /> },
        { title: 'Disputes & Support', path: '/disputes', icon: <ReportProblemIcon /> },
      ];
    } else if (role === 'trainer') {
      return [
        { title: 'Trainer Dashboard', path: '/trainer/dashboard', icon: <DashboardIcon /> },
        { title: 'Assigned Members', path: '/trainer/members', icon: <PeopleAltIcon /> },
        { title: 'Workout Plan Builder', path: '/trainer/workout-builder', icon: <AssignmentIcon /> },
        { title: 'Class Attendance', path: '/trainer/attendance', icon: <HowToRegIcon /> },
        { title: 'Client Messages', path: '/messages', icon: <ChatIcon /> },
        { title: 'My Profile', path: '/profile', icon: <AccountCircleIcon /> },
      ];
    } else {
      // Default / Member
      return [
        { title: 'Dashboard', path: '/member/dashboard', icon: <DashboardIcon /> },
        { title: 'Membership & Plans', path: '/member/memberships', icon: <CardMembershipIcon /> },
        { title: 'Classes & Bookings', path: '/member/classes', icon: <EventAvailableIcon /> },
        { title: 'Workout Plans', path: '/member/workouts', icon: <FitnessCenterIcon /> },
        { title: 'Fitness Progress', path: '/member/progress', icon: <ShowChartIcon /> },
        { title: 'Invoices & Receipts', path: '/member/payments', icon: <ReceiptLongIcon /> },
        { title: 'Trainer Chat', path: '/messages', icon: <ChatIcon /> },
        { title: 'Disputes & Support', path: '/disputes', icon: <ReportProblemIcon /> },
        { title: 'My Profile', path: '/profile', icon: <AccountCircleIcon /> },
      ];
    }
  };

  const navItems = getNavItems();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#ffffff' }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          }}
        >
          <FitnessCenterIcon fontSize="medium" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1, color: '#0f172a' }}>
            ApexFit Gym
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5 }}>
            MANAGEMENT SYSTEM
          </Typography>
        </Box>
      </Box>

      {/* Role Indicator Banner */}
      <Box sx={{ px: 2.5, py: 1 }}>
        <Chip
          label={`${(role || 'member').toUpperCase()} PORTAL`}
          color={role === 'admin' ? 'error' : role === 'trainer' ? 'secondary' : 'primary'}
          size="small"
          sx={{ fontWeight: 700, fontSize: '0.68rem', width: '100%', borderRadius: 1.5 }}
        />
      </Box>

      <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />

      {/* Nav List */}
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {navItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.title} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  bgcolor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                  color: isSelected ? 'primary.main' : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  '&:hover': {
                    bgcolor: isSelected ? 'rgba(37, 99, 235, 0.12)' : '#f8fafc',
                    color: 'primary.main',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isSelected ? 'primary.main' : '#64748b',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />

      {/* User Info Bar at Bottom of Sidebar */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#f8fafc', m: 1.5, borderRadius: 2 }}>
        <Avatar
          sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontWeight: 700 }}
          src={user?.avatar ? `/storage/${user.avatar}` : undefined}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ color: '#1e293b' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block">
            {user?.email || ''}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} title="Log Out" sx={{ color: '#ef4444' }}>
          <ExitToAppIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#1e293b',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#0f172a' }}>
              {navItems.find((n) => n.path === location.pathname)?.title || 'ApexFit Platform'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notification Dropdown */}
            <NotificationBell />

            {/* Profile Dropdown */}
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0.5, ml: 1 }}>
              <Avatar
                sx={{ width: 34, height: 34, bgcolor: 'primary.dark', fontSize: '0.85rem' }}
                src={user?.avatar ? `/storage/${user.avatar}` : undefined}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { width: 200, mt: 1, borderRadius: 2 } }}
            >
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
                <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
                My Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon><ExitToAppIcon fontSize="small" color="error" /></ListItemIcon>
                Log Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawers */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e2e8f0' },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: '#f8fafc',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="xl" sx={{ p: 0 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
}
