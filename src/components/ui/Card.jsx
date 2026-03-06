import React from 'react';

const Card = ({ 
  children, 
  title, 
  subtitle,
  headerAction,
  footer,
  padding = true,
  shadow = true,
  hover = false,
  className = '' 
}) => {
  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200
        ${shadow ? 'shadow-sm' : ''}
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      
      <div className={padding ? 'p-6' : ''}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
