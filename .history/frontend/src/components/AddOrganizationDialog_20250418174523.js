import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Alert,
  DialogTitle as MuiDialogTitle,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialog-container': {
    alignItems: 'flex-start',
    marginTop: '5vh'
  }
}));

const StyledDialogTitle = styled(MuiDialogTitle)(({ theme }) => ({
  backgroundColor: '#7C3AED',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  '& .MuiTypography-root': {
    color: 'white'
  }
}));

const AddOrganizationDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    domain: '',
    organization: '',
    email: ''
  });
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (open) {
      fetchSuperadminData();
      fetchOrganizations();
    }
  }, [open]);

  const fetchSuperadminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/superadmin', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.organization) {
        setFormData(prev => ({
          ...prev,
          organization: response.data.organization,
          name: response.data.organization
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch organization details');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/organizations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrganizations(response.data);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  };

  const validateEmailDomain = (email, domain) => {
    if (!email || !domain) return false;
    const emailParts = email.split('@');
    return emailParts.length === 2 && emailParts[1].toLowerCase() === domain.toLowerCase();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'organization') {
      const selectedOrg = organizations.find(org => org.domain === value);
      const domain = selectedOrg ? selectedOrg.domain : '';

      setFormData(prev => ({
        ...prev,
        [name]: value,
        domain: domain, // Auto-fill the domain field
        email: '' // Reset email when organization changes
      }));

      setEmailError('');
    } else if (name === 'email') {
      setFormData(prev => ({ ...prev, email: value }));

      // Validate email in real-time
      if (formData.organization) {
        if (!validateEmailDomain(value, formData.organization)) {
          setEmailError(`Email must be from ${formData.organization} domain`);
        } else {
          setEmailError('');
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (error) setError('');
  };

  const validateForm = () => {
    // Check all required fields are filled
    if (!formData.name || !formData.ownerName || !formData.domain || !formData.email || !formData.organization) {
      return false;
    }

    // Strict email domain validation
    if (!validateEmailDomain(formData.email, formData.organization)) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Final validation before submit
    if (!validateForm()) {
      if (formData.email && formData.organization) {
        if (!validateEmailDomain(formData.email, formData.organization)) {
          setEmailError(`Email must be from ${formData.organization} domain`);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/organizations',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        onSuccess(response.data);
        handleClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      ownerName: '',
      domain: '',
      organization: '',
      email: ''
    });
    setError('');
    setEmailError('');
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6">Add New Organization</Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Organization</InputLabel>
                <Select
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  label="Select Organization"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: '#7C3AED'
                      },
                      '&:hover fieldset': {
                        borderColor: '#6D28D9'
                      }
                    }
                  }}
                >
                  {organizations.map((org) => (
                    <MenuItem key={org.domain} value={org.domain}>
                      {org.name} ({org.domain})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the parent organization</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                helperText="Enter the name of the new organization"
                placeholder="e.g., Pinnacle Solutions"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#7C3AED'
                    },
                    '&:hover fieldset': {
                      borderColor: '#6D28D9'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Owner Name"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                helperText="Enter the name of the organization owner"
                placeholder="e.g., John Doe"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#7C3AED'
                    },
                    '&:hover fieldset': {
                      borderColor: '#6D28D9'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                helperText="Enter the organization's domain (e.g., neworg.in)"
                placeholder="e.g., neworg.in"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#7C3AED'
                    },
                    '&:hover fieldset': {
                      borderColor: '#6D28D9'
                    }
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                helperText={formData.organization ? `Must be from ${formData.organization} domain` : 'Please select an organization first'}
                placeholder={formData.organization ? `e.g., admin@${formData.organization}` : 'Select organization first'}
                variant="outlined"
                error={!!emailError}
                disabled={!formData.organization}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    '& fieldset': {
                      borderColor: '#7C3AED'
                    },
                    '&:hover fieldset': {
                      borderColor: '#6D28D9'
                    }
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: formData.organization ? '#000000' : 'rgba(0, 0, 0, 0.38)'
                  }
                }}
              />
              {emailError && (
                <FormHelperText error>{emailError}</FormHelperText>
              )}
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          sx={{
            borderRadius: '8px',
            border: '1px solidrgb(148, 92, 246)',
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
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !validateForm()}
          sx={{
            borderRadius: '8px',
            backgroundColor: '#7C3AED',
            color: 'white',
            textTransform: 'none',
            px: 3,
            '&:hover': {
              backgroundColor: '#6D28D9',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(124, 58, 237, 0.5)',
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }}
        >
          {loading ? 'Adding...' : 'Add Organization'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddOrganizationDialog;