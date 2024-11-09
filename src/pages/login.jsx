import React, { useState } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const appLogin = import.meta.env.VITE_APP_LOGIN;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = { email, password };

        try {
            const response = await axios.post(appLogin, payload);
            if (response.data.success) {
                
                const userData = response.data;                 
                // Store user data in local storage
                localStorage.setItem('userName', userData.name);
                localStorage.setItem('wsnaid', userData.wsnaid);
                localStorage.setItem('aftid', userData.aftid);
                localStorage.setItem('anaid', userData.anaid);

                window.location.href = '/home';
            } else {
                setError('Wrong email or password');
            }
        } catch (error) {
            console.error('Error:', error);
            setError('An error occured, contact support');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-6" style={{ backgroundImage: `url('/loginbg.png')` }}>
            <div className="bg-white bg-opacity-70 backdrop-blur-lg border border-white border-opacity-30 rounded-lg p-8 shadow-lg w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
                    WSNA Login
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? 'text' : 'password'} // Toggle input type
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Password"
                            />
                            <div
                                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                                onClick={togglePasswordVisibility} // Toggle visibility on click
                            >
                                {showPassword ? (
                                    <FaEyeSlash className="text-gray-500" />
                                ) : (
                                    <FaEye className="text-gray-500" />
                                )}
                            </div>
                        </div>
                        <div className="text-sm mt-2">
                            <a href="/resetpassword" className="font-medium text-indigo-800 hover:text-indigo-500">
                                Forgot your password?
                            </a>
                        </div>
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 text-center font-medium">
                            {error}
                        </div>
                    )}
                    <div>
                        <button
                            type="submit"
                            className={`w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                            disabled={loading}
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            Not a member? Contact us at membership@wsna.org
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
