import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

export default function StatCard({ title, value, subtitle, icon, color = '#2563eb', gradient }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          bgcolor: color,
          opacity: 0.08,
          pointerEvents: 'none',
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#0f172a' }}>
              {value}
            </Typography>
          </Box>
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: `${color}15`,
              color: color,
              width: 48,
              height: 48,
              borderRadius: 3,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
