import React, { useState } from 'react';

const Input = ({ 
  label, 
  type = 'text', 
  placeholder = '', 
  value, 
  onChange,
  name,
  id,
  error,
  helperText,
  required = false,
  disabled = false,
  icon,
  className = '',
  fullWidth = true
}) => {
  const inputId = id || name;
  const [showPassword, setShowPassword] = useState(false);
  
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{icon}</span>
          </div>
        )}
        
        <input
          type={inputType}
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            block w-full rounded-lg border 
            ${icon ? 'pl-10' : 'pl-3'} ${isPasswordField ? 'pr-10' : 'pr-3'} py-2.5
            text-gray-900 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            transition-colors duration-200
            ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
          `}
        />
        
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPassword ? (
              // Eye Slash Icon (Hide)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              // Eye Icon (Show)
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
