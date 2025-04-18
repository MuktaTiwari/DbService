import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Grid,
  Typography,
  
  IconButton,
  styled,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: '#7C3AED',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AddUserDialog = ({ open, onClose, formData, onChange, onSubmit }) => {
  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6">Add New User</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers>
        <Box component="form" sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <FormField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={onChange}
                required
                autoComplete="new-password"
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={onChange}
                required
                variant="outlined"
                placeholder="Enter domain"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, backgroundColor: '#f8f9fa' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            borderColor: '#7C3AED',
            color: '#7C3AED',
            '&:hover': {
              borderColor: '#6D28D9',
              backgroundColor: 'rgba(124, 58, 237, 0.04)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          variant="contained"
          sx={{
            borderRadius: '8px',
            bgcolor: '#7C3AED',
            '&:hover': {
              bgcolor: '#6D28D9',
            },
          }}
        >
          Add User
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddUserDialog; 