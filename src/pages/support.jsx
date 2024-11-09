import React, { useState } from 'react';
import LeftNavBar from '../components/leftnavbar';

export default function SupportPage () {

  const [message, setMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    // Handle sending email logic
    alert('Message sent');
  };

  return (
    <div className="flex">
            <LeftNavBar />
    <div className="min-h-screen p-6 bg-gray-100 flex-1 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Support</h1>
        <form onSubmit={handleSend} className="space-y-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="border border-gray-300 rounded-md px-4 py-2 w-full"
            rows="6"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
          >
            Send Message
          </button>
        </form>
        <div className="mt-6">
          <h2 className="text-xl font-bold">Contact Details</h2>
          <p className="text-gray-700">Email: support@your-site.com</p>
          <p className="text-gray-700">Phone: (123) 456-7890</p>
        </div>
      </div>
    </div>
    </div>
  );
}
