import React from 'react';

const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  rounded = false,
  className = '' 
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
    resolved: 'bg-blue-100 text-blue-800',
    moderate: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  return (
    <span 
      className={`
        inline-flex items-center font-medium
        ${variants[variant]}
        ${sizes[size]}
        ${rounded ? 'rounded-full' : 'rounded'}
        ${className}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
