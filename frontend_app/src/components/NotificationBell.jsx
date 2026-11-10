
import React, { useState, useEffect, useCallback } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Button,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';

import api from '../api/axios';

// Simple local icons: no additional icon package required.
const NotificationsIcon = () => <span>🔔</span>;
const EventAvailableIcon = () => <span>📅</span>;
const WarningAmberIcon = () => <span>⚠️</span>;
const PaymentIcon = () => <span>💳</span>;
const FitnessCenterIcon = () => <span>🏋️</span>;
const InfoIcon = () => <span>ℹ️</span>;

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Convert different possible API response formats into an array.
  const getNotificationArray = (responseData) => {
    if (Array.isArray(responseData)) {
      return responseData;
    }

    if (Array.isArray(responseData?.notifications)) {
      return responseData.notifications;
    }

    if (Array.isArray(responseData?.data)) {
      return responseData.data;
    }

    if (Array.isArray(responseData?.data?.notifications)) {
      return responseData.data.notifications;
    }

    if (Array.isArray(responseData?.data?.data)) {
      return responseData.data.data;
    }

    return [];
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');

      const items = getNotificationArray(res.data);

      // Keep only valid notification objects.
      const validItems = items.filter(
        (item) => item && typeof item === 'object'
      );

      setNotifications(validItems);

      const unread = validItems.filter(
        (notification) => !notification.is_read
      ).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (id, isRead) => {
    if (!id || isRead) return;

    try {
      await api.put(`/notifications/${id}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');

      await fetchNotifications();
      handleClose();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <EventAvailableIcon />;

      case 'membership':
      case 'reminder':
        return <WarningAmberIcon />;

      case 'payment':
        return <PaymentIcon />;

      case 'workout':
        return <FitnessCenterIcon />;

      default:
        return <InfoIcon />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleString();
  };

  return (
    <>
      {/* Notification bell */}
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
        aria-label="Open notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Notification dropdown */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 480,
            borderRadius: 3,
            p: 0.5,
            boxShadow: 6
          }
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top'
        }}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              Notifications
            </Typography>

            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} New`}
                size="small"
                color="primary"
              />
            )}
          </Box>

          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={markAllRead}
              sx={{ fontSize: '0.75rem' }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notification list */}
        <List
          sx={{
            p: 0,
            maxHeight: 340,
            overflowY: 'auto'
          }}
        >
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((n, index) => (
              <ListItem
                key={n.id ?? index}
                alignItems="flex-start"
                onClick={() => markAsRead(n.id, n.is_read)}
                sx={{
                  bgcolor: n.is_read
                    ? 'transparent'
                    : 'rgba(37, 99, 235, 0.05)',
                  cursor: n.is_read ? 'default' : 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  },
                  transition: 'background-color 0.2s',
                  py: 1.5
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    mt: 0.5
                  }}
                >
                  {getIcon(n.type)}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      fontWeight={n.is_read ? 500 : 700}
                    >
                      {n.title || 'Notification'}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {n.message || 'No additional information'}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{
                          fontSize: '0.68rem',
                          mt: 0.5
                        }}
                      >
                        {formatDate(n.created_at)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
}
