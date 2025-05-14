import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Snackbar,
  Alert,
  Grid,
  Paper,
  Avatar,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axiosInstance from '../utils/axiosInstance';

const MainSection = styled('section')({
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden',
});

const ImageSection = styled('div')({
  flex: 1,
  backgroundImage: 'url(/assets/images/l.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  height: '100vh',
});

const LoginSection = styled('div')({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#ffffff', // Changed from #407BFF to white
  padding: '2rem',
});

const StyledPaper = styled(Paper)({
  padding: '3rem', // Increased padding for more internal space
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--shadow-lg)',
  backgroundColor: 'white',
  width: '100%',
  maxWidth: '500px', // Increased from 400px to 500px to make the container larger
});

const StyledAvatar = styled(Avatar)({
  width: 80,
  height: 80,
  backgroundColor: '#666',
  margin: '0 auto 1rem auto',
  border: '3px solid #fff',
  boxShadow: '0 0 0 2px var(--primary-color)',
});

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetStep, setResetStep] = useState('email'); // 'email', 'otp', 'password'
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData({ ...resetData, [name]: value });
    if (resetError) setResetError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
  
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }
  
    try {
      const res = await axiosInstance.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
  
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess(true);
  
      setTimeout(() => {
        const userType = res.data.user.user_type;
        if (userType === 'superadmin') {
          navigate('/superadmin-dashboard');
        } else {
          navigate('/databases');
        }
      }, 2000);
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    setShowResetPassword(true);
    setResetStep('email');
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();

    if (!resetData.email.trim()) {
      setResetError('Please enter your email');
      return;
    }

    try {
      await axiosInstance.post('/api/auth/request-reset', {
        email: resetData.email
      });

      setResetStep('otp');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();

    if (!resetData.otp.trim()) {
      setResetError('Please enter the OTP');
      return;
    }

    setResetStep('password');
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!resetData.newPassword || !resetData.confirmPassword) {
      setResetError('Please fill in both password fields');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    try {
      await axiosInstance.post('/api/auth/reset-password', {
        email: resetData.email,
        otp: resetData.otp,
        newPassword: resetData.newPassword
      });

      setSuccess(true);
      setShowResetPassword(false);
      setResetData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
      setResetStep('email');
      setFormData({ email: resetData.email, password: resetData.newPassword });
    } catch (err) {
      setResetError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <MainSection>
      <ImageSection />
      <LoginSection>
        <StyledPaper>
          <StyledAvatar>
            <img
              src="/assets/images/profile.avif"
              alt="Profile"
              style={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%'
              }}
            />
          </StyledAvatar>

          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ fontWeight: 600, color: 'var(--text-primary)' }}
          >
            {showResetPassword 
              ? (resetStep === 'email' ? 'Request Password Reset' 
                : resetStep === 'otp' ? 'Enter OTP' 
                : 'Reset Password') 
              : 'Login'}
          </Typography>

          {!showResetPassword ? (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                error={Boolean(error)}
                helperText={error}
                placeholder="Enter your email"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                type="password"
                label="Password"
                name="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={Boolean(error)}
              />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 1}}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={handleForgotPasswordClick}
                  sx={{ textDecoration: "underline", color: "var(--primary-color)" }}
                >
                  Forgot Password?
                </Link>
              </Box>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  bgcolor: 'var(--primary-color)',
                  textTransform: 'none',
                  fontSize: 'var(--font-size-base)',
                  padding: '0.75rem',
                  borderRadius: 'var(--border-radius)',
                  '&:hover': { bgcolor: 'var(--primary-hover)' },
                }}
              >
                Sign In
              </Button>
            </Box>
          ) : (
            <Box component="form" 
              onSubmit={resetStep === 'email' ? handleRequestResetOtp : 
                      resetStep === 'otp' ? handleVerifyOtp : handleResetPasswordSubmit} 
              noValidate sx={{ mt: 3 }}
            >
              {resetStep === 'email' && (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={resetData.email}
                    onChange={handleResetChange}
                    error={Boolean(resetError)}
                    helperText={resetError}
                    placeholder="Enter your email"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      bgcolor: 'var(--primary-color)',
                      textTransform: 'none',
                      fontSize: 'var(--font-size-base)',
                      padding: '0.75rem',
                      borderRadius: 'var(--border-radius)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' },
                    }}
                  >
                    Send OTP
                  </Button>
                </>
              )}
              {resetStep === 'otp' && (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="OTP"
                    name="otp"
                    value={resetData.otp}
                    onChange={handleResetChange}
                    error={Boolean(resetError)}
                    helperText={resetError}
                    placeholder="Enter the OTP sent to your email"
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      bgcolor: 'var(--primary-color)',
                      textTransform: 'none',
                      fontSize: 'var(--font-size-base)',
                      padding: '0.75rem',
                      borderRadius: 'var(--border-radius)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' },
                    }}
                  >
                    Verify OTP
                  </Button>
                </>
              )}
              {resetStep === 'password' && (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type={showNewPassword ? 'text' : 'password'}
                    label="New Password"
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    error={Boolean(resetError)}
                    helperText={resetError}
                    placeholder="Enter new password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    error={Boolean(resetError)}
                    placeholder="Confirm new password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      bgcolor: 'var(--primary-color)',
                      textTransform: 'none',
                      fontSize: 'var(--font-size-base)',
                      padding: '0.75rem',
                      borderRadius: 'var(--border-radius)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' },
                    }}
                  >
                    Reset Password
                  </Button>
                </>
              )}
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetStep('email');
                    setResetData({ email: '', otp: '', newPassword: '', confirmPassword: '' });
                  }}
                  sx={{ textDecoration: "underline", color: "var(--primary-color)" }}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          )}
        </StyledPaper>
      </LoginSection>

      <Snackbar open={success} autoHideDuration={4000}>
        <Alert severity="success" sx={{ width: '100%' }}>
          {showResetPassword ? 'Password reset successful!' : 'Login successful! Redirecting to dashboard...'}
        </Alert>
      </Snackbar>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={Boolean(resetError)} autoHideDuration={4000} onClose={() => setResetError('')}>
        <Alert onClose={() => setResetError('')} severity="error" sx={{ width: '100%' }}>
          {resetError}
        </Alert>
      </Snackbar>
    </MainSection>
  );
};

export default Login;