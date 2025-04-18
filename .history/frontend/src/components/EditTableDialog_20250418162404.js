import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';

const EditTableDialog = ({ 
  open, 
  onClose, 
  dbName, 
  tableName, 
  columns, 
  onSave 
}) => {
  const [editedColumns, setEditedColumns] = useState([]);
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'TEXT',
    defaultValue: ''
  });

  useEffect(() => {
    if (columns) {
      setEditedColumns([...columns]);
    }
  }, [columns]);

  const handleColumnChange = (index, field, value) => {
    const updatedColumns = [...editedColumns];
    updatedColumns[index] = {
      ...updatedColumns[index],
      [field]: value
    };
    setEditedColumns(updatedColumns);
  };

  const handleAddColumn = () => {
    if (!newColumn.name) return;
    
    setEditedColumns([...editedColumns, {
      column_name: newColumn.name,
      data_type: newColumn.type,
      column_default: newColumn.defaultValue
    }]);
    
    setNewColumn({
      name: '',
      type: 'TEXT',
      defaultValue: ''
    });
  };

  const handleRemoveColumn = (index) => {
    const updatedColumns = [...editedColumns];
    updatedColumns.splice(index, 1);
    setEditedColumns(updatedColumns);
  };

  const handleSave = () => {
    onSave(dbName, tableName, editedColumns);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Table: {tableName}
        <Typography variant="subtitle2" color="textSecondary">
          Database: {dbName}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Existing Columns
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Column Name</TableCell>
                <TableCell>Data Type</TableCell>
                <TableCell>Default Value</TableCell>
                <TableCell>Nullable</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {editedColumns.map((col, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <TextField
                      value={col.column_name}
                      onChange={(e) => handleColumnChange(index, 'column_name', e.target.value)}
                      fullWidth
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={col.data_type}
                        onChange={(e) => handleColumnChange(index, 'data_type', e.target.value)}
                      >
                        <MenuItem value="TEXT">TEXT</MenuItem>
                        <MenuItem value="INTEGER">INTEGER</MenuItem>
                        <MenuItem value="BIGINT">BIGINT</MenuItem>
                        <MenuItem value="NUMERIC">NUMERIC</MenuItem>
                        <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                        <MenuItem value="DATE">DATE</MenuItem>
                        <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                        <MenuItem value="JSONB">JSONB</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      value={col.column_default || ''}
                      onChange={(e) => handleColumnChange(index, 'column_default', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="NULL"
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={col.is_nullable === 'YES' ? 'YES' : 'NO'}
                        onChange={(e) => handleColumnChange(
                          index, 
                          'is_nullable', 
                          e.target.value === 'YES' ? 'YES' : 'NO'
                        )}
                      >
                        <MenuItem value="YES">YES</MenuItem>
                        <MenuItem value="NO">NO</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleRemoveColumn(index)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Add New Column
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              label="Column Name"
              value={newColumn.name}
              onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
              size="small"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Data Type</InputLabel>
              <Select
                value={newColumn.type}
                onChange={(e) => setNewColumn({...newColumn, type: e.target.value})}
                label="Data Type"
              >
                <MenuItem value="TEXT">TEXT</MenuItem>
                <MenuItem value="INTEGER">INTEGER</MenuItem>
                <MenuItem value="BIGINT">BIGINT</MenuItem>
                <MenuItem value="NUMERIC">NUMERIC</MenuItem>
                <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                <MenuItem value="DATE">DATE</MenuItem>
                <MenuItem value="TIMESTAMP">TIMESTAMP</MenuItem>
                <MenuItem value="JSONB">JSONB</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Default Value"
              value={newColumn.defaultValue}
              onChange={(e) => setNewColumn({...newColumn, defaultValue: e.target.value})}
              size="small"
            />
            <IconButton 
              onClick={handleAddColumn}
              color="primary"
              disabled={!newColumn.name}
            >
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTableDialog;