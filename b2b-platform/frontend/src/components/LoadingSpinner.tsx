import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 8, 
  className = '', 
}) => {
  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <Loader className={`w-${size} h-${size} animate-spin text-primary-400`} />
    </div>
  );
};

export default LoadingSpinner;