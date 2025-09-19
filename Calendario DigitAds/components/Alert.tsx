import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export default function Alert({ type, children, className = '' }: AlertProps) {
  const baseClasses = 'p-4 rounded-lg border';
  
  const typeClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const classes = `${baseClasses} ${typeClasses[type]} ${className}`;

  return (
    <div className={classes} role="alert">
      {children}
    </div>
  );
}
