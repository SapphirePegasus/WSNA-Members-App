import React, { useState } from 'react';
import LeftNavBar from '../components/leftnavbar';


export default function PaymentPage() {

    const [activeTab, setActiveTab] = useState('paypal');

    return (
        <div className="flex">
            <LeftNavBar />
            <div className="min-h-screen p-6 bg-gray-100 flex-1">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                    <h1 className="text-3xl font-bold mb-6">Payment Options</h1>
                    <div className="mb-6">
                        <div className="flex space-x-4">
                            <button
                                className={`py-2 px-4 rounded-md ${activeTab === 'paypal' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setActiveTab('paypal')}
                            >
                                PayPal
                            </button>
                            <button
                                className={`py-2 px-4 rounded-md ${activeTab === 'googlepay' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setActiveTab('googlepay')}
                            >
                                Google Pay
                            </button>
                            <button
                                className={`py-2 px-4 rounded-md ${activeTab === 'stripe' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => setActiveTab('stripe')}
                            >
                                Stripe
                            </button>
                        </div>
                    </div>
                    {activeTab === 'paypal' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">PayPal</h2>
                            <a href="https://your-paypal-link.com" className="text-blue-600 hover:underline">Paypal link goes here</a>
                        </div>
                    )}
                    {activeTab === 'googlepay' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Google Pay</h2>
                            <a href="https://your-google-pay-link.com" className="text-blue-600 hover:underline">Upi or link goes here</a>
                            <img src="/gpayqr.png" alt="QR Code" className="w-32 h-32" />
                        </div>
                    )}
                    {activeTab === 'stripe' && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">Card</h2>
                            <form className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Card Number"
                                    className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                />
                                <input
                                    type="text"
                                    placeholder="CVC"
                                    className="border border-gray-300 rounded-md px-4 py-2 w-full"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                                >
                                    Pay Now
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
