import React, { useState } from 'react';
import { Input, Button, Card } from '../components/ui';
import { login } from '../services/authService';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call auth service (uses JWT and localStorage)
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Login successful - JWT token saved to localStorage automatically
        onLogin(result.user);
      } else {
        // Login failed - show error on specific field
        const errorMessage = result.error;
        
        // Determine which field to show error on
        if (errorMessage.includes('Email') || errorMessage.includes('User') || errorMessage.includes('not exist')) {
          setErrors({ email: errorMessage });
        } else if (errorMessage.includes('password') || errorMessage.includes('Wrong')) {
          setErrors({ password: errorMessage });
        } else if (errorMessage.includes('account') || errorMessage.includes('approved') || errorMessage.includes('pending')) {
          setErrors({ email: errorMessage });
        } else {
          // Generic error - show on email field
          setErrors({ email: errorMessage });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        email: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-green-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PureCycle</h1>
          <p className="text-gray-600">Waste Management System</p>
        </div>

        {/* Login Card */}
        <Card padding={false} shadow className="overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-6">Sign in to your account to continue</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                name="email"
                placeholder="admin@purecycle.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </a>
              </div>
              
              <Button 
                type="submit" 
                fullWidth 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
          
          {/* Demo Credentials */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600 mb-2 font-medium">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p><span className="font-medium">Admin:</span> admin@purecycle.com / admin123</p>
              <p><span className="font-medium">Staff:</span> staff@purecycle.com / staff123</p>
            </div>
          </div>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          &copy; 2025 PureCycle. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
