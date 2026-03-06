import React from 'react';

const Select = ({ 
  label, 
  options = [], 
  value, 
  onChange,
  name,
  id,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  fullWidth = true
}) => {
  const selectId = id || name;
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`
          block w-full rounded-lg border px-3 py-2.5
          text-gray-900 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
          ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default Select;
