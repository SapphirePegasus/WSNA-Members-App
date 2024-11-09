import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

export default function Success() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: 'url(/loginbg.png' }} 
    >
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-green-600 mb-4">Success!</h1>
          <p className="text-lg text-gray-600 mb-8">
            Your operation was completed successfully.
          </p>
          <Link
            to="/home"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-indigo-700 transition-all duration-300"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
