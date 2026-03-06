import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Badge, Avatar } from '../components/ui';
import { AlertModal } from '../components/modals';
import boholData from '../data/bohol_complete_barangays.json';
import api from '../services/api';

const ProfilePage = ({ user }) => {
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || user?.name || '',
    email: user?.email || '',
    contactNo: user?.contactNo || user?.contact_number || '',
    cityMunicipality: user?.municipality || user?.city_municipality || '',
    barangay: user?.barangay || '',
    purok: user?.purok || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // --- Address Data Processing ---
  // Get list of cities/municipalities
  const cityMunicipalities = useMemo(() => {
    return boholData.city_municipalities.map(city => city.name).sort();
  }, []);

  // Get barangays based on selected city
  const barangays = useMemo(() => {
    if (!profileData.cityMunicipality) return [];
    const selectedCity = boholData.city_municipalities.find(
      city => city.name === profileData.cityMunicipality
    );
    return selectedCity ? selectedCity.barangays.sort() : [];
  }, [profileData.cityMunicipality]);

  // Purok options (1-7 as standard)
  const puroks = useMemo(() => {
    if (!profileData.barangay) return [];
    return Array.from({ length: 7 }, (_, i) => `Purok ${i + 1}`);
  }, [profileData.barangay]);

  // Handle address changes
  const handleAddressChange = (field, value) => {
    setProfileData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Reset dependent fields when parent changes
      if (field === 'cityMunicipality') {
        updated.barangay = '';
        updated.purok = '';
      } else if (field === 'barangay') {
        updated.purok = '';
      }
      
      return updated;
    });
    
    // Clear errors for this field
    if (profileErrors[field]) {
      setProfileErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // --- Profile Handlers ---
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    if (!profileData.fullname.trim()) errors.fullname = 'Name is required';
    if (!profileData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profileData.email)) errors.email = 'Invalid email format';
    if (!profileData.contactNo.trim()) errors.contactNo = 'Contact number is required';
    else if (profileData.contactNo.length !== 11) errors.contactNo = 'Must be exactly 11 digits';
    
    // Address validation
    if (!profileData.cityMunicipality) errors.cityMunicipality = 'City/Municipality is required';
    if (!profileData.barangay) errors.barangay = 'Barangay is required';
    if (!profileData.purok) errors.purok = 'Purok is required';
    
    return errors;
  };

  const handleSubmitProfile = (e) => {
    e.preventDefault();
    const errors = validateProfile();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setShowSaveProfileModal(true);
  };

  const confirmSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      
      const response = await api.profile.update({
        fullname: profileData.fullname,
        email: profileData.email,
        contact_number: profileData.contactNo,
        city_municipality: profileData.cityMunicipality,
        barangay: profileData.barangay,
        purok: profileData.purok,
      });

      if (response.success) {
        setShowSaveProfileModal(false);
        setProfileErrors({});
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setShowSaveProfileModal(false);
      
      // Set validation errors from backend
      if (err.errors) {
        setProfileErrors(err.errors);
      } else {
        // Generic error message
        setProfileErrors({ 
          general: err.message || 'Failed to update profile' 
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- Password Handlers ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (!passwordData.confirmPassword) errors.confirmPassword = 'Please confirm your new password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    setShowChangePasswordModal(true);
  };

  const confirmChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      
      const response = await api.profile.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        new_password_confirmation: passwordData.confirmPassword,
      });

      if (response.success) {
        setShowChangePasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setShowChangePasswordModal(false);
      
      // Set validation errors from backend
      if (err.errors) {
        setPasswordErrors(err.errors);
      } else {
        // Generic error message
        setPasswordErrors({ 
          general: err.message || 'Failed to change password' 
        });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return null;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
    if (strength === 2) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4' };
    if (strength === 3) return { label: 'Good', color: 'bg-blue-500', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  // Handle profile picture upload
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      setShowUploadModal(true);
    }
  };

  const confirmUploadProfilePicture = async () => {
    if (!selectedFile) return;

    try {
      setUploadingImage(true);
      
      // Step 1: Upload image to get the path
      const uploadResponse = await api.upload.profilePicture(selectedFile);
      
      if (uploadResponse.success) {
        // Step 2: Update ONLY profile_path in database
        const updateResponse = await api.profile.update({
          profile_path: uploadResponse.data.path,
        });

        if (updateResponse.success) {
          setShowUploadModal(false);
          setSelectedFile(null);
          
          // Reload the page to show new image
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      setShowUploadModal(false);
      setSelectedFile(null);
      
      // Show error in profile errors
      setProfileErrors({
        profile_picture: [err.message || 'Failed to upload profile picture']
      });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Avatar Card */}
        <div className="lg:col-span-1">
          <Card className="text-center">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar 
                  src={user?.profilePath || user?.profile_path} 
                  name={profileData.fullname} 
                  size="xl"
                  className="shadow-lg"
                />
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-md transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mt-4">{profileData.fullname}</h2>
              <p className="text-gray-600 text-sm mt-1">{profileData.email}</p>

              <div className="mt-3">
                <Badge variant={user?.role === 'admin' ? 'primary' : 'info'} rounded>
                  {user?.role === 'admin' ? 'Admin' : 'Staff'}
                </Badge>
              </div>

              <div className="w-full border-t border-gray-200 mt-6 pt-6 space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{profileData.email}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{profileData.contactNo}</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="capitalize">{user?.role}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Card */}
          <Card title="Personal Information" subtitle="Update your personal details">
            {profileSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">Profile updated successfully!</p>
              </div>
            )}

            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <Input
                label="Full Name"
                name="fullname"
                type="text"
                value={profileData.fullname}
                onChange={handleProfileChange}
                error={profileErrors.fullname}
                placeholder="Enter your full name"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleProfileChange}
                error={profileErrors.email}
                placeholder="Enter your email"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              <Input
                label="Contact Number"
                name="contactNo"
                type="text"
                value={profileData.contactNo}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value.length <= 11) {
                    setProfileData(prev => ({ ...prev, contactNo: value }));
                    if (profileErrors.contactNo) {
                      setProfileErrors(prev => ({ ...prev, contactNo: '' }));
                    }
                  }
                }}
                error={profileErrors.contactNo}
                placeholder="09xxxxxxxxx"
                helperText="11 digits, numbers only"
                required
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />

              {/* Address Section */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Address Information
                </h3>

                {/* City/Municipality Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City/Municipality <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <select
                      value={profileData.cityMunicipality}
                      onChange={(e) => handleAddressChange('cityMunicipality', e.target.value)}
                      className={`
                        w-full pl-10 pr-4 py-2.5 border rounded-lg
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-colors duration-200
                        ${profileErrors.cityMunicipality ? 'border-red-500' : 'border-gray-300'}
                        ${!profileData.cityMunicipality ? 'text-gray-400' : 'text-gray-900'}
                      `}
                    >
                      <option value="">Select City/Municipality</option>
                      {cityMunicipalities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  {profileErrors.cityMunicipality && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.cityMunicipality}</p>
                  )}
                </div>

                {/* Barangay Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <select
                      value={profileData.barangay}
                      onChange={(e) => handleAddressChange('barangay', e.target.value)}
                      disabled={!profileData.cityMunicipality}
                      className={`
                        w-full pl-10 pr-4 py-2.5 border rounded-lg
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-colors duration-200
                        ${profileErrors.barangay ? 'border-red-500' : 'border-gray-300'}
                        ${!profileData.barangay ? 'text-gray-400' : 'text-gray-900'}
                        ${!profileData.cityMunicipality ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                      `}
                    >
                      <option value="">
                        {profileData.cityMunicipality ? 'Select Barangay' : 'Select City/Municipality first'}
                      </option>
                      {barangays.map((barangay) => (
                        <option key={barangay} value={barangay}>{barangay}</option>
                      ))}
                    </select>
                  </div>
                  {profileErrors.barangay && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.barangay}</p>
                  )}
                </div>

                {/* Purok Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purok <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <select
                      value={profileData.purok}
                      onChange={(e) => handleAddressChange('purok', e.target.value)}
                      disabled={!profileData.barangay}
                      className={`
                        w-full pl-10 pr-4 py-2.5 border rounded-lg
                        focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-colors duration-200
                        ${profileErrors.purok ? 'border-red-500' : 'border-gray-300'}
                        ${!profileData.purok ? 'text-gray-400' : 'text-gray-900'}
                        ${!profileData.barangay ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                      `}
                    >
                      <option value="">
                        {profileData.barangay ? 'Select Purok' : 'Select Barangay first'}
                      </option>
                      {puroks.map((purok) => (
                        <option key={purok} value={purok}>{purok}</option>
                      ))}
                    </select>
                  </div>
                  {profileErrors.purok && (
                    <p className="mt-1 text-sm text-red-600">{profileErrors.purok}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Profile
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Card */}
          <Card title="Change Password" subtitle="Keep your account secure with a strong password">
            {passwordSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">Password changed successfully!</p>
              </div>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-4">
              {/* General error message from backend */}
              {passwordErrors.general && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                  <p className="text-sm font-medium">{passwordErrors.general}</p>
                </div>
              )}

              <div>
                <Input
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                {/* Backend error for current_password */}
                {passwordErrors.current_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password[0]}</p>
                )}
              </div>

              <div>
                <Input
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.newPassword}
                  placeholder="Enter new password"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  }
                />
                {/* Backend error for new_password */}
                {passwordErrors.new_password && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password[0]}</p>
                )}
                {/* Password Strength */}
                {passwordData.newPassword && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.label === 'Weak' ? 'text-red-600' :
                        passwordStrength.label === 'Fair' ? 'text-yellow-600' :
                        passwordStrength.label === 'Good' ? 'text-blue-600' : 'text-green-600'
                      }`}>{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`}></div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {[
                        { label: 'At least 8 characters', test: passwordData.newPassword.length >= 8 },
                        { label: 'Uppercase letter (A-Z)', test: /[A-Z]/.test(passwordData.newPassword) },
                        { label: 'Number (0-9)', test: /[0-9]/.test(passwordData.newPassword) },
                        { label: 'Special character (!@#$)', test: /[^A-Za-z0-9]/.test(passwordData.newPassword) },
                      ].map((req, i) => (
                        <li key={i} className={`flex items-center space-x-2 text-xs ${req.test ? 'text-green-600' : 'text-gray-400'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {req.test
                              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            }
                          </svg>
                          <span>{req.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm new password"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                {/* Backend error for confirmation */}
                {passwordErrors.new_password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password_confirmation[0]}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Save Profile Confirmation */}
      <AlertModal
        isOpen={showSaveProfileModal}
        onClose={() => setShowSaveProfileModal(false)}
        onConfirm={confirmSaveProfile}
        title="Update Profile"
        message="Are you sure you want to save these changes to your profile?"
        confirmText="Save Changes"
        variant="info"
        isLoading={isSavingProfile}
      />

      {/* Change Password Confirmation */}
      <AlertModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onConfirm={confirmChangePassword}
        title="Change Password"
        message="Are you sure you want to change your password? You will need to use the new password on your next login."
        confirmText="Change Password"
        variant="warning"
        isLoading={isChangingPassword}
      />

      {/* Upload Profile Picture Confirmation */}
      <AlertModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
        }}
        onConfirm={confirmUploadProfilePicture}
        title="Upload Profile Picture"
        message={`Are you sure you want to upload "${selectedFile?.name}"? This will replace your current profile picture.`}
        confirmText="Upload"
        variant="info"
        isLoading={uploadingImage}
      />
    </div>
  );
};

export default ProfilePage;
