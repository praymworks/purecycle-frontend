import React from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';
import Footer from './Footer';

const MainLayout = ({ user, onLogout, currentPage, onPageChange, children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <TopNav user={user} onLogout={onLogout} onPageChange={onPageChange} />

      {/* Main Container */}
      <div className="flex pt-16">
        {/* Side Navigation */}
        <SideNav user={user} currentPage={currentPage} onPageChange={onPageChange} />

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          <div className="p-6">
            {children}
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
