import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Storage as StorageIcon, Delete as DeleteIcon,
  Visibility as VisibilityIcon, ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddDatabaseDialog from './AddDatabaseDialog';
import CreateTableDialog from './CreateTableDialog';
import { styled } from '@mui/material/styles';
import { Person as PersonIcon } from '@mui/icons-material';
import {}

const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: 'var(--spacing-unit) * 3',
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--shadow-lg)',
  backgroundColor: 'var(--bg-paper)',
  marginTop: 'var(--spacing-unit) * 3',
}));

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [databaseFormData, setDatabaseFormData] = useState({
    databaseName: '',
    tableName: '',
    csvFile: null,
    columns: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [databases, setDatabases] = useState([]);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: '',
    name: '',
    dbName: ''
  });

  const [editDialog, setEditDialog] = useState({
    open: false,
    dbName: '',
    tableName: '',
    columns: []
  });
  

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/databases', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const transformedData = response.data.map(db => ({
        name: db.dbname,
        tables: db.tables.filter(t => t.tablename).map(t => t.tablename),
        apiKey: db.apikey,
        dbid: db.dbid
      }));
      
      setDatabases(transformedData);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch databases',
        severity: 'error'
      });
      setDatabases([]);
    }
  };

  const handleDeleteDatabase = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/databases/${deleteDialog.name}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSnackbar({
        open: true,
        message: 'Database deleted successfully!',
        severity: 'success'
      });
      
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchDatabases();
    } catch (error) {
      console.error('Error deleting database:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete database',
        severity: 'error'
      });
    }
  };

  const handleDeleteTable = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/databases/${deleteDialog.dbName}/tables/${deleteDialog.name}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setSnackbar({
        open: true,
        message: 'Table deleted successfully!',
        severity: 'success'
      });
      
      setDeleteDialog({ ...deleteDialog, open: false });
      fetchDatabases();
    } catch (error) {
      console.error('Error deleting table:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to delete table',
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (type, name, dbName = '') => {
    setDeleteDialog({
      open: true,
      type,
      name,
      dbName
    });
  };

  const handleCreateTable = async (dbName, formData) => {
    try {
      setSnackbar({
        open: true,
        message: 'Creating table...',
        severity: 'info',
        autoHideDuration: null
      });
  
      const response = await axios.post(
        `http://localhost:5000/api/databases/${dbName}/create-table`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      setSnackbar({
        open: true,
        message: 'Table created successfully!',
        severity: 'success'
      });
  
      setDatabases(prevDatabases => {
        return prevDatabases.map(db => {
          if (db.name === dbName) {
            const tableName = formData.get('tableName');
            return {
              ...db,
              tables: [...db.tables, tableName]
            };
          }
          return db;
        });
      });
  
    } catch (error) {
      console.error('Error creating table:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to create table',
        severity: 'error'
      });
    }
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDatabaseFormData({
      databaseName: '',
      tableName: '',
      csvFile: null
    });
  };

  const handleDatabaseChange = (e) => {
    setDatabaseFormData({ ...databaseFormData, [e.target.name]: e.target.value });
  };

  const handleDatabaseFileChange = (e) => {
    setDatabaseFormData({ ...databaseFormData, csvFile: e.target.files[0] });
  };

  const handleDatabaseSubmit = async (formDataWithColumns) => {
    if (!formDataWithColumns.databaseName || !formDataWithColumns.tableName) {
      setSnackbar({
        open: true,
        message: 'Database name and table name are required',
        severity: 'error'
      });
      return;
    }
  
    const hasColumns = formDataWithColumns.columns && formDataWithColumns.columns.some(col => col.name.trim());
    if (!hasColumns && !formDataWithColumns.csvFile) {
      setSnackbar({
        open: true,
        message: 'Either define columns or upload a CSV file',
        severity: 'error'
      });
      return;
    }
  
    if (hasColumns) {
      for (const column of formDataWithColumns.columns) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
          setSnackbar({
            open: true,
            message: 'Column names must start with a letter or underscore and contain only letters, numbers, and underscores',
            severity: 'error'
          });
          return;
        }
      }
    }
  
    try {
      const formData = new FormData();
      formData.append('databaseName', formDataWithColumns.databaseName);
      formData.append('tableName', formDataWithColumns.tableName);
      
      if (formDataWithColumns.csvFile) {
        formData.append('csvFile', formDataWithColumns.csvFile);
      }
      
      if (formDataWithColumns.columns && formDataWithColumns.columns.length > 0) {
        formData.append('columns', JSON.stringify(formDataWithColumns.columns));
      }
  
      setSnackbar({
        open: true,
        message: 'Creating database...',
        severity: 'info',
        autoHideDuration: null
      });
  
      const response = await axios.post('http://localhost:5000/api/databases', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000
      });
  
      setSnackbar({
        open: true,
        message: 'Database created successfully!',
        severity: 'success'
      });
  
      await fetchDatabases();
      handleCloseDialog();
  
      if (response.data.apiKey) {
        setCurrentApiKey(response.data.apiKey);
        setOpenApiKeyDialog(true);
      }
  
    } catch (error) {
      console.error('Error creating database:', error);
      
      let errorMessage = 'Error creating database';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleShowApiKey = (apiKey) => {
    setCurrentApiKey(apiKey);
    setOpenApiKeyDialog(true);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(currentApiKey);
    setSnackbar({
      open: true,
      message: 'API key copied to clipboard!',
      severity: 'success'
    });
    setOpenApiKeyDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRowClick = (dbName) => {
    navigate(`/database/${dbName}`);
  };




  const handleEditTable = (dbName, tableName) => {
    // First fetch the current columns for the table
    axios.get(`http://localhost:5000/api/databases/${dbName}/tables/${tableName}/columns`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => {
      setEditDialog({
        open: true,
        dbName,
        tableName,
        columns: response.data
      });
    })
    .catch(error => {
      console.error('Error fetching table columns:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch table columns',
        severity: 'error'
      });
    });
  };
  
  // Add this function to handle saving the edited table
  const handleSaveTableChanges = async (dbName, tableName, columns) => {
    try {
      setSnackbar({
        open: true,
        message: 'Updating table structure...',
        severity: 'info',
        autoHideDuration: null
      });
  
      await axios.put(
        `http://localhost:5000/api/databases/${dbName}/tables/${tableName}`,
        { columns },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
  
      setSnackbar({
        open: true,
        message: 'Table updated successfully!',
        severity: 'success'
      });
  
      // Refresh the databases list to reflect changes
      fetchDatabases();
    } catch (error) {
      console.error('Error updating table:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to update table',
        severity: 'error'
      });
    }
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
          onClick={() => navigate('/UserDashboard')}
          style={{ color: 'var(--text-primary)' }}
        >
          <ListItemIcon><PersonIcon style={{ color: 'var(--primary-color)' }} /></ListItemIcon>
          <ListItemText primary="Users Dashboard" />
        </ListItem>
      </List>
    </div>
  );

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
          <Typography variant="h6" sx={{ flexGrow: 1, color: '#ffffff' }}>
  User Dashboard
</Typography>

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
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<StorageIcon />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: 'var(--primary-color)',
                borderRadius: 'var(--border-radius)',
                px: 4,
                py: 1.5,
                fontSize: 'var(--font-size-base)',
                '&:hover': {
                  backgroundColor: 'var(--primary-hover)',
                },
              }}
            >
              Create Database
            </Button>
          </Box>

          <StyledPaper>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'var(--text-primary)' }}>
              Your Databases
            </Typography>
            <TableContainer>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell style={{ color: 'var(--text-primary)' }}>Database Name</TableCell>
        <TableCell style={{ color: 'var(--text-primary)' }}>Tables</TableCell>
        <TableCell style={{ color: 'var(--text-primary)' }}>API Key</TableCell>
        <TableCell style={{ color: 'var(--text-primary)' }} align="right">Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {databases.map((db) => (
        <TableRow 
          key={db.name}
          hover
          sx={{ 
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'var(--primary-light-hover)'
            }
          }}
        >
          <TableCell 
            onClick={() => handleRowClick(db.name)}
            style={{ color: 'var(--text-primary)' }}
          >
            {db.name}
          </TableCell>
          <TableCell onClick={() => handleRowClick(db.name)}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {db.tables.map((table) => (
                <Box 
                  key={table} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    backgroundColor: 'var(--primary-light)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5
                  }}
                >
                  <Typography 
                    variant="body2"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/database/${db.name}/table/${table}`);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: 'var(--primary-color)',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {table}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick('table', table, db.name);
                    }}
                    sx={{ 
                      color: 'var(--error-color)',
                      ml: 0.5,
                      p: 0.5
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </TableCell>
          <TableCell onClick={() => handleRowClick(db.name)}>
            {db.apiKey && (
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowApiKey(db.apiKey);
                }}
                sx={{
                  textTransform: 'none',
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  '&:hover': {
                    borderColor: 'var(--primary-hover)',
                  },
                }}
              >
                Show API Key
              </Button>
            )}
          </TableCell>
          <TableCell align="right">
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDatabase(db.name);
                  setOpenTableDialog(true);
                }}
                sx={{
                  backgroundColor: 'var(--primary-color)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-hover)',
                  },
                }}
              >
                Create Table
              </Button>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick('database', db.name);
                }}
                sx={{ color: 'var(--error-color)' }}
              >
                <DeleteIcon />
              </IconButton>
              <IconButton
  size="small"
  onClick={(e) => {
    e.stopPropagation();
    handleEditTable(db.name, table);
  }}
  sx={{ 
    color: 'var(--primary-color)',
    ml: 0.5,
    p: 0.5
  }}
>
  <EditIcon fontSize="small" />
</IconButton>
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
          </StyledPaper>
        </Container>

        <AddDatabaseDialog
          open={openDialog}
          onClose={handleCloseDialog}
          formData={databaseFormData}
          onChange={handleDatabaseChange}
          onFileChange={handleDatabaseFileChange}
          onSubmit={handleDatabaseSubmit}
        />

        <CreateTableDialog
            open={openTableDialog}
            onClose={() => setOpenTableDialog(false)}
            dbName={selectedDatabase}
            onSubmit={handleCreateTable}
        />

<EditTableDialog
  open={editDialog.open}
  onClose={() => setEditDialog({...editDialog, open: false})}
  dbName={editDialog.dbName}
  tableName={editDialog.tableName}
  columns={editDialog.columns}
  onSave={handleSaveTableChanges}
/>


        <Dialog open={openApiKeyDialog} onClose={() => setOpenApiKeyDialog(false)}>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>API Key</DialogTitle>
          <DialogContent>
            <DialogContentText style={{ color: 'var(--text-primary)' }}>
              Here is your API key for this database. Keep it secure and don't share it with others.
            </DialogContentText>
            <Box sx={{
              mt: 2,
              p: 2,
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              color: 'var(--text-primary)'
            }}>
              {currentApiKey}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenApiKeyDialog(false)}
              sx={{
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--primary-light-hover)'
                }
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleCopyApiKey}
              startIcon={<ContentCopyIcon />}
              variant="contained"
              sx={{
                backgroundColor: 'var(--primary-color)',
                '&:hover': {
                  backgroundColor: 'var(--primary-hover)',
                },
              }}
            >
              Copy
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            Delete {deleteDialog.type === 'database' ? 'Database' : 'Table'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText style={{ color: 'var(--text-primary)' }}>
              Are you sure you want to delete {deleteDialog.type} "{deleteDialog.name}"? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
              sx={{
                color: 'var(--text-primary)',
                '&:hover': {
                  backgroundColor: 'var(--primary-light-hover)'
                }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={deleteDialog.type === 'database' ? handleDeleteDatabase : handleDeleteTable}
              sx={{
                backgroundColor: 'var(--error-color)',
                '&:hover': {
                  backgroundColor: '#d32f2f',
                },
              }}
              variant="contained"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ 
              width: '100%',
              backgroundColor: snackbar.severity === 'error' ? 'var(--error-color)' : 
                             snackbar.severity === 'success' ? 'var(--success-color)' :
                             snackbar.severity === 'warning' ? 'var(--warning-color)' :
                             'var(--info-color)',
              color: 'white'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default UserDashboard;