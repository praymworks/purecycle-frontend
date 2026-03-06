import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-600">
        <p>&copy; 2025 PureCycle. All rights reserved.</p>
        <div className="flex items-center space-x-4 mt-2 md:mt-0">
          <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
          <span className="text-gray-300">|</span>
          <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
