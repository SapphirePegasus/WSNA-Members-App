import React, { useState } from 'react';
import LeftNavBar from '../components/leftnavbar';

export default function SettingsPage() {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [themeColor, setThemeColor] = useState('#ffffff');

    const handleProfilePicChange = (e) => {
        setProfilePic(URL.createObjectURL(e.target.files[0]));
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Handle save logic here
        alert('Settings saved');
    };

    return (
        <div className="flex">
            <LeftNavBar />
            <div className="min-h-screen p-6 bg-gray-100 flex-1 p-6">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold mb-6">Settings</h1>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                placeholder="Your email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                placeholder="New password"
                            />
                        </div>
                        <div>
                            <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700">Profile Picture</label>
                            <input
                                id="profilePic"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicChange}
                                className="mt-1"
                            />
                            {profilePic && <img src={profilePic} alt="Profile" className="mt-4 w-32 h-32 object-cover rounded-full" />}
                        </div>
                        <div>
                            <label htmlFor="themeColor" className="block text-sm font-medium text-gray-700">Theme Color</label>
                            <input
                                id="themeColor"
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                        >
                            Save Settings
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
