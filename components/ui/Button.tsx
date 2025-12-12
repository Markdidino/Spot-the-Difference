import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'neutral' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-full font-bold shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 border-b-4";
  
  const variants = {
    primary: "bg-btn-primary border-pink-600 text-white hover:bg-pink-400",
    secondary: "bg-btn-secondary border-blue-600 text-white hover:bg-blue-400",
    neutral: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "bg-red-400 border-red-600 text-white hover:bg-red-300",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl w-full sm:w-auto",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="text-current">{icon}</span>}
      {children}
    </button>
  );
};