import React from 'react';

export default function TopNavBar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex-shrink-0 flex items-center">
            <img className="h-8 w-auto" src="/pwa-512x512.png" alt="Logo" />
          </div>
          <div className="hidden md:flex space-x-4 items-center">
            <a href="/home" className="text-gray-800 hover:text-gray-600">Dashboard</a>
            <a href="/profile" className="text-gray-800 hover:text-gray-600">Profile</a>
            <a href="/support" className="text-gray-800 hover:text-gray-600">Support</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
