import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon, Add as AddIcon, Settings as SettingsIcon,
  Dashboard as DashboardIcon, Search as SearchIcon, Person as PersonIcon,
  Groups as GroupsIcon, Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--shadow-lg)',
  backgroundColor: 'var(--bg-paper)',
}));

// Static organization options
const ORGANIZATIONS = [
  { organization_name: 'idfc.in' },
  { organization_name: 'hdfc.in' },
  { organization_name: 'sbi.in' }
];

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    organization: '',
    email: '',
    name: '',
    username: '',
    password: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      organization: '',
      email: '',
      name: '',
      username: '',
      password: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.organization || !formData.email || 
        !formData.name || !formData.username || !formData.password) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/users', {
        name: formData.name,
        email: formData.email,
        organization: formData.organization,
        username: formData.username,
        password: formData.password
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      
      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error adding user:', error);
      console.error('Error response:', error.response?.data);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding user',
        severity: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      console.log(`Deleting user with ID: ${userId}`);
      
      const response = await axios.delete(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error deleting user',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/dashboard')}>
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

  return (
    <Box sx={{ display: 'flex', backgroundColor: 'var(--bg-secondary)', minHeight: '100vh' }}>
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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          <IconButton color="inherit"><AddIcon /></IconButton>
          <IconButton color="inherit"><SettingsIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container maxWidth="lg">
          <StyledPaper>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{
                  backgroundColor: 'var(--primary-color)',
                  borderRadius: '12px',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: 'var(--primary-hover)',
                  },
                }}
              >
                Add organization
              </Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'var(--text-secondary)' }} />,
                  sx: { borderRadius: 'var(--border-radius)' },
                }}
              />
              <Button variant="outlined" sx={{
                borderColor: 'var(--primary-color)',
                color: 'var(--primary-color)',
                borderRadius: 'var(--border-radius)',
                '&:hover': {
                  backgroundColor: 'var(--primary-light)',
                  borderColor: 'var(--primary-hover)'
                }
              }}>Filters</Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Time checked in</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">Loading users...</TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No users found</TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 32, 
                              height: 32, 
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-color)', 
                              color: 'var(--primary-text)',
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center'
                            }}>
                              {user.name?.[0]?.toUpperCase()}
                            </Box>
                            {user.name || ''}
                          </Box>
                        </TableCell>
                        <TableCell>{user.username || ''}</TableCell>
                        <TableCell>{user.email || ''}</TableCell>
                        <TableCell>{user.organization || ''}</TableCell>
                        <TableCell>{user.created_at ? new Date(user.created_at).toLocaleTimeString() : ''}</TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={() => handleDeleteUser(user.user_id)}
                            color="error"
                            aria-label="delete user"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Select Organization</InputLabel>
                  <Select
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    label="Select Organization"
                  >
                    {ORGANIZATIONS.map((org) => (
                      <MenuItem key={org.organization_name} value={org.organization_name}>
                        {org.organization_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                Add organization
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;