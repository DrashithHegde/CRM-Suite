import React from 'react';
import { ThreeDots } from 'react-loader-spinner';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center card">
        <ThreeDots
          height="48"
          width="48"
          radius="6"
          color="#4F46E5"
          ariaLabel="loading"
          visible={true}
        />
        <p className="mt-4 text-slate-700 dark:text-gray-200 font-medium">Loading CRM System...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
