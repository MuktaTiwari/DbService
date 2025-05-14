import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Chip, CircularProgress, Grid, Card, CardContent,
  CardHeader, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, ListItemAvatar, ListItemIcon
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
import axiosInstance from '../utils/axiosInstance';

const drawerWidth = 240;

const Organizations = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const orgUsers = response.data.filter(user => user.organization_name);
        const orgsMap = orgUsers.reduce((acc, user) => {
          if (!acc[user.organization_name]) {
            acc[user.organization_name] = {
              organization_name: user.organization_name,
              domain_name: user.domain_name,
              users: []
            };
          }
          acc[user.organization_name].users.push({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.owner_email,
            created_at: user.created_at
          });
          return acc;
        }, {});

        setOrganizations(Object.values(orgsMap));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load organizations');
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
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/databases')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate('/organizations')}>
          <ListItemIcon><GroupsIcon /></ListItemIcon>
          <ListItemText primary="Organizations" />
        </ListItem>
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" sx={{ flexGrow: 1,color: 'var(--primary-text)' }}>Organizations</Typography>
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
            '& .MuiDrawer-paper': { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom >
            Organizations
          </Typography>

          <Grid container spacing={3}>
            {organizations.map((org) => (
              <Grid item xs={12} key={org.organization_name}>
                <Card sx={{ mb: 3 }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <BusinessIcon />
                      </Avatar>
                    }
                    title={org.organization_name}
                    subheader={
                      <>
                        <Typography variant="body2">{org.users.length} Users</Typography>
                        <Typography variant="body2">Domain: {org.domain_name}</Typography>
                      </>
                    }
                    action={
                      <Chip label={org.organization_name} />
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
                              '&:hover': { backgroundColor: 'action.hover' },
                            }}
                            onClick={() => handleUserClick(user)}
                          >
                            <ListItemAvatar>
                              <Avatar>
                                <PersonIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={user.full_name}
                              secondary={
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                                  {user.email}
                                </Box>
                              }
                            />
                           
                          </ListItem>
                          {index < org.users.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                      {org.users.length === 0 && (
                        <ListItem>
                          <ListItemText primary="No users in this organization" />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Dialog open={openDialog} onClose={handleCloseDialog}>
            {selectedUser && (
              <>
                <DialogTitle>User Details</DialogTitle>
                <DialogContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 56, height: 56 }}>
                        <PersonIcon fontSize="large" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedUser.full_name}</Typography>
                        <Typography variant="body2">{selectedUser.email}</Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">User ID</Typography>
                      <Typography variant="body1">{selectedUser.user_id}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Created At</Typography>
                      <Typography variant="body1">
                        {new Date(selectedUser.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog}>Close</Button>
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