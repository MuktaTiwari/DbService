import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Grid,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton as MuiIconButton,
  Tooltip,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: 'var(--primary-color)',
  color: 'var(--primary-text)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const UploadButton = styled(Button)(({ theme }) => ({
  border: '2px dashed var(--primary-color)',
  backgroundColor: 'var(--primary-light)',
  '&:hover': {
    backgroundColor: 'var(--primary-light-hover)',
    border: '2px dashed var(--primary-hover)',
  },
}));

const dataTypes = [
  'TEXT',
  'INTEGER',
  'BIGINT',
  'NUMERIC',
  'REAL',
  'DOUBLE PRECISION',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'JSON',
  'UUID'
];

const AddDatabaseDialog = ({ open, onClose, formData, onChange, onFileChange, onSubmit }) => {
  const [columns, setColumns] = useState([
    { name: '', type: 'TEXT', isPrimary: false, isNotNull: false, isUnique: false, defaultValue: '' }
  ]);

  const handleAddColumn = () => {
    setColumns([...columns, { name: '', type: 'TEXT', isPrimary: false, isNotNull: false, isUnique: false, defaultValue: '' }]);
  };

  const handleRemoveColumn = (index) => {
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  const handleColumnChange = (index, field, value) => {
    const newColumns = [...columns];

    if (field === 'isPrimary' && value === true) {
      newColumns.forEach(col => col.isPrimary = false);
    }

    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  const handleSubmit = () => {
    if (!formData.databaseName || !formData.tableName) {
      alert('Database name and table name are required');
      return;
    }

    if (columns.every(col => !col.name.trim()) && !formData.csvFile) {
      alert('Either define columns or upload a CSV file');
      return;
    }

    for (const column of columns) {
      if (column.name.trim() && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
        alert('Column names must start with a letter or underscore and contain only letters, numbers, and underscores');
        return;
      }
    }

    const filteredColumns = columns.filter(col => col.name.trim());

    onSubmit({
      ...formData,
      columns: filteredColumns
    });
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          marginTop: '5vh'
        }
      }}
    >
      <StyledDialogTitle>
        <Typography variant="h6" style={{ color: 'var(--primary-text)' }}>Create New Database</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'var(--primary-text)' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers sx={{
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <Box component="form" noValidate>
          <Grid container spacing={2}>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Database Name"
                name="databaseName"
                value={formData.databaseName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Table Name"
                name="tableName"
                value={formData.tableName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
              />
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Table Columns (Optional - define or upload CSV)
              </Typography>
              <Box sx={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Column Name</TableCell>
                      <TableCell>Data Type</TableCell>
                      <TableCell>Primary</TableCell>
                      <TableCell>Not Null</TableCell>
                      <TableCell>Unique</TableCell>
                      <TableCell>Default</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {columns.map((column, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            fullWidth
                            value={column.name}
                            onChange={(e) => handleColumnChange(index, 'name', e.target.value)}
                            placeholder="Column name"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={column.type}
                              onChange={(e) => handleColumnChange(index, 'type', e.target.value)}
                            >
                              {dataTypes.map((type) => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Primary Key">
                            <Checkbox
                              checked={column.isPrimary}
                              onChange={(e) => handleColumnChange(index, 'isPrimary', e.target.checked)}
                              icon={<KeyIcon />}
                              checkedIcon={<KeyIcon color="primary" />}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Not Null">
                            <Checkbox
                              checked={column.isNotNull}
                              onChange={(e) => handleColumnChange(index, 'isNotNull', e.target.checked)}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Unique">
                            <Checkbox
                              checked={column.isUnique}
                              onChange={(e) => handleColumnChange(index, 'isUnique', e.target.checked)}
                            />
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={column.defaultValue}
                            onChange={(e) => handleColumnChange(index, 'defaultValue', e.target.value)}
                            placeholder="Default"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Remove column">
                            <MuiIconButton
                              onClick={() => handleRemoveColumn(index)}
                            >
                              <DeleteIcon />
                            </MuiIconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddColumn}
                  variant="outlined"
                >
                  Add Column
                </Button>
              </Box>
            </FormField>

            <FormField item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Optional CSV Upload
              </Typography>
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.type !== 'text/csv') {
                      alert('Please upload a CSV file');
                      return;
                    }
                    onFileChange(e);
                  }
                }}
              />
              <label htmlFor="csv-upload">
                <UploadButton
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: 'var(--border-radius)', textTransform: 'none' }}
                >
                  Upload CSV File (Optional)
                </UploadButton>
              </label>
              {formData.csvFile && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={formData.csvFile.name}
                    onDelete={() => onChange({ target: { name: 'csvFile', value: null } })}
                    sx={{ backgroundColor: 'var(--primary-color)', color: 'var(--primary-text)' }}
                  />
                </Box>
              )}
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            borderRadius: 'var(--border-radius)',
            borderColor: 'var(--primary-color)',
            color: 'var(--primary-color)',
            '&:hover': {
              borderColor: 'var(--primary-hover)',
              backgroundColor: 'var(--primary-light)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: 'var(--primary-color)',
            borderRadius: 'var(--border-radius)',
            '&:hover': {
              backgroundColor: 'var(--primary-hover)',
            },
          }}
        >
          Create
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;