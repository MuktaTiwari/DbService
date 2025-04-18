import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Chip, CircularProgress, Grid, Card, CardContent,
  CardHeader, Avatar, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, ListItemAvatar,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 240;

const Organizations = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/users');

        const usersByOrg = response.data.reduce((acc, user) => {
          if (!acc[user.organization]) {
            acc[user.organization] = [];
          }
          acc[user.organization].push(user);
          return acc;
        }, {});

        const orgsWithUsers = Object.keys(usersByOrg).map(orgName => ({
          organization_name: orgName,
          users: usersByOrg[orgName]
        }));

        setUsers(orgsWithUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const drawer = (
    <div style={{ backgroundColor: 'var(--bg-paper)' }}>
      <Toolbar>
        <Typography variant="h6" style={{ color: 'var(--text-primary)' }}>1SPOC</Typography>
      </Toolbar>
      <Divider style={{ backgroundColor: 'var(--border-color)' }} />
      <List>
        <ListItem 
          button 
          onClick={() => navigate('/dashboard')}
          style={{ color: 'var(--text-primary)' }}
        >
          <ListItemIcon><DashboardIcon style={{ color: 'var(--primary-color)' }} /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem 
          button 
          onClick={() => navigate('/organizations')}
          style={{ color: 'var(--text-primary)' }}
        >
          <ListItemIcon><GroupsIcon style={{ color: 'var(--primary-color)' }} /></ListItemIcon>
          <ListItemText primary="Organizations" />
        </ListItem>
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <CircularProgress style={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, backgroundColor: 'var(--bg-secondary)' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      backgroundColor: 'var(--bg-secondary)', 
      minHeight: '100vh' 
    }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'var(--primary-color)',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Organizations</Typography>
          <IconButton color="inherit"><SettingsIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ 
            display: { xs: 'block', sm: 'none' }, 
            '& .MuiDrawer-paper': { 
              width: drawerWidth,
              backgroundColor: 'var(--bg-paper)'
            } 
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ 
            display: { xs: 'none', sm: 'block' }, 
            '& .MuiDrawer-paper': { 
              width: drawerWidth,
              backgroundColor: 'var(--bg-paper)'
            } 
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: 3, 
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom style={{ color: 'var(--text-primary)' }}>
            Organizations
          </Typography>

          <Grid container spacing={3}>
            {users.map((org) => (
              <Grid item xs={12} key={org.organization_name}>
                <Card sx={{ 
                  mb: 3,
                  backgroundColor: 'var(--bg-paper)',
                  borderRadius: 'var(--border-radius)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'var(--primary-color)' }}>
                        <BusinessIcon style={{ color: 'var(--primary-text)' }} />
                      </Avatar>
                    }
                    title={<Typography style={{ color: 'var(--text-primary)' }}>{org.organization_name}</Typography>}
                    subheader={`${org.users.length} Users`}
                    action={
                      <Chip
                        label={org.organization_name}
                        sx={{ 
                          ml: 1,
                          backgroundColor: 'var(--primary-light)',
                          color: 'var(--primary-color)',
                          '&:hover': {
                            backgroundColor: 'var(--primary-light-hover)'
                          }
                        }}
                      />
                    }
                  />
                  <CardContent>
                    <List sx={{ width: '100%' }}>
                      {org.users.map((user, index) => (
                        <React.Fragment key={user.user_id}>
                          <ListItem
                            sx={{
                              py: 2,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'var(--primary-light-hover)',
                              },
                            }}
                            onClick={() => handleUserClick(user)}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'var(--primary-light)' }}>
                                <PersonIcon style={{ color: 'var(--primary-color)' }} />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={<Typography style={{ color: 'var(--text-primary)' }}>{user.name}</Typography>}
                              secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon fontSize="small" sx={{ mr: 1, color: 'var(--text-secondary)' }} />
                                  <Typography style={{ color: 'var(--text-secondary)' }}>{user.email}</Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Chip
                                label={user.username}
                                sx={{
                                  backgroundColor: 'var(--primary-light)',
                                  color: 'var(--primary-color)'
                                }}
                                size="small"
                              />
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < org.users.length - 1 && <Divider style={{ backgroundColor: 'var(--border-color)' }} />}
                        </React.Fragment>
                      ))}
                      {org.users.length === 0 && (
                        <ListItem>
                          <ListItemText 
                            primary={<Typography style={{ color: 'var(--text-secondary)' }}>No users in this organization</Typography>} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* User Details Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog}>
            {selectedUser && (
              <>
                <DialogTitle style={{ color: 'var(--text-primary)' }}>User Details</DialogTitle>
                <DialogContent>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 2, 
                    pt: 2,
                    color: 'var(--text-primary)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: 'var(--primary-light)' }}>
                        <PersonIcon fontSize="large" style={{ color: 'var(--primary-color)' }} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedUser.name}</Typography>
                        <Typography variant="body2" style={{ color: 'var(--text-secondary)' }}>
                          {selectedUser.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" style={{ color: 'var(--text-secondary)' }}>Username</Typography>
                      <Typography variant="body1">{selectedUser.username}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" style={{ color: 'var(--text-secondary)' }}>Organization</Typography>
                      <Typography variant="body1">{selectedUser.organization}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" style={{ color: 'var(--text-secondary)' }}>User ID</Typography>
                      <Typography variant="body1">{selectedUser.user_id}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" style={{ color: 'var(--text-secondary)' }}>Created At</Typography>
                      <Typography variant="body1">
                        {new Date(selectedUser.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button 
                    onClick={handleCloseDialog}
                    sx={{
                      color: 'var(--primary-color)',
                      '&:hover': {
                        backgroundColor: 'var(--primary-light-hover)'
                      }
                    }}
                  >
                    Close
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default Organizations;