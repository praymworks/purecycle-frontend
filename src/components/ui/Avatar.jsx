import React from 'react';

/**
 * Avatar Component
 * Displays user profile picture or fallback to first letter circle
 * 
 * @param {string} src - Image path from database (e.g., 'uploads/images/profile_path/123.jpg')
 * @param {string} name - User's name for fallback letter
 * @param {string} size - Size variant: xs, sm, md, lg, xl
 * @param {string} className - Additional CSS classes
 */
const Avatar = ({ src, name = 'User', size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-16 h-16 text-2xl',
    xl: 'w-28 h-28 text-4xl',
  };

  const getInitial = () => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  // Build full image URL from path
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // If already a full URL (starts with http), use as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Otherwise, prepend backend base URL
    const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:8000';
    return `${BASE_URL}/${path}`;
  };

  const baseClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold overflow-hidden ${className}`;

  const imageUrl = getImageUrl(src);

  // If image exists and is valid, show image
  if (imageUrl) {
    return (
      <div className={baseClasses}>
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to letter circle if image fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div className="w-full h-full bg-primary-600 text-white items-center justify-center hidden">
          {getInitial()}
        </div>
      </div>
    );
  }

  // Fallback: Show first letter circle
  return (
    <div className={`${baseClasses} bg-primary-600 text-white`}>
      {getInitial()}
    </div>
  );
};

export default Avatar;
