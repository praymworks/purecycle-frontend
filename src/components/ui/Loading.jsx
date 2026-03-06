import React from 'react';

const Loading = ({ message = 'Loading...', fullPage = true }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-lg font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600"></div>
        <p className="mt-3 text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
