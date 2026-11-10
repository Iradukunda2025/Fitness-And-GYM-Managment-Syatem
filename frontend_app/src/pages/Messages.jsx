import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      const timer = setInterval(() => {
        fetchMessages(activeConversation.id, true);
      }, 5000); // 5s poll for active chat
      return () => clearInterval(timer);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/conversations');
      const convs = res.data.data || res.data || [];
      setConversations(convs);
      if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId, background = false) => {
    try {
      const res = await api.get(`/conversations/${convId}/messages`);
      setMessages(res.data.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      await api.post(`/conversations/${activeConversation.id}/messages`, {
        message: newMessage,
      });
      setNewMessage('');
      fetchMessages(activeConversation.id);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const getOtherParticipant = (conv) => {
    if (!conv) return { name: 'Chat', role: '' };
    return user?.id === conv.member_id ? conv.trainer : conv.member;
  };

  const activeOther = getOtherParticipant(activeConversation);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} color="#0f172a">
          Private Trainer & Member Messaging
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate directly about workout adjustments, technique tips, fitness goals, and session rescheduling.
        </Typography>
      </Box>

      <Card sx={{ borderRadius: 4, height: '70vh', minHeight: 520, overflow: 'hidden' }}>
        <Grid container sx={{ height: '100%' }}>
          {/* Left Column: Conversations List */}
          <Grid
            item
            xs={12}
            sm={4}
            sx={{
              borderRight: '1px solid #e2e8f0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
            }}
          >
            <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Conversations ({conversations.length})
              </Typography>
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
              {conversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No active conversations yet.
                  </Typography>
                </Box>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = activeConversation?.id === conv.id;
                  return (
                    <ListItem
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      sx={{
                        borderRadius: 3,
                        mb: 0.5,
                        cursor: 'pointer',
                        bgcolor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        '&:hover': { bgcolor: isSelected ? 'rgba(37, 99, 235, 0.12)' : '#f8fafc' },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: isSelected ? 'primary.main' : '#64748b' }}>
                          {other?.name?.charAt(0) || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={isSelected ? 700 : 600}>
                            {other?.name || 'User'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {conv.latest_message?.message || `${other?.role?.toUpperCase()} | Active thread`}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })
              )}
            </List>
          </Grid>

          {/* Right Column: Chat Window */}
          <Grid
            item
            xs={12}
            sm={8}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#f8fafc',
            }}
          >
            {activeConversation ? (
              <>
                {/* Chat Top Bar */}
                <Box
                  sx={{
                    p: 2,
                    px: 3,
                    bgcolor: '#ffffff',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                    {activeOther?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {activeOther?.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {activeOther?.role?.toUpperCase()} • Direct Private Fitness Channel
                    </Typography>
                  </Box>
                </Box>

                {/* Messages Body */}
                <Box
                  sx={{
                    flexGrow: 1,
                    p: 3,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                  }}
                >
                  {messages.length === 0 ? (
                    <Box sx={{ my: 'auto', textAlign: 'center' }}>
                      <ChatIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Start your conversation with {activeOther?.name}! Send a message below.
                      </Typography>
                    </Box>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.sender_id === user?.id;
                      return (
                        <Box
                          key={m.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              px: 2,
                              maxWidth: '75%',
                              borderRadius: 3,
                              borderBottomRightRadius: isMe ? 0 : 3,
                              borderBottomLeftRadius: isMe ? 3 : 0,
                              bgcolor: isMe ? 'primary.main' : '#ffffff',
                              color: isMe ? '#ffffff' : '#0f172a',
                              border: isMe ? 'none' : '1px solid #e2e8f0',
                            }}
                          >
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {m.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                textAlign: 'right',
                                mt: 0.5,
                                fontSize: '0.65rem',
                                color: isMe ? 'rgba(255,255,255,0.7)' : 'text.disabled',
                              }}
                            >
                              {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Paper>
                        </Box>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Typing Box */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    bgcolor: '#ffffff',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Message ${activeOther?.name || '...'}`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={sending || !newMessage.trim()}
                    sx={{ p: 1.2, bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ m: 'auto', textAlign: 'center', p: 4 }}>
                <ChatIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  Select a conversation on the left to start messaging.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
}
