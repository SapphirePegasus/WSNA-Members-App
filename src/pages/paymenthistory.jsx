import React, { useState, useEffect } from 'react';
import LeftNavBar from '../components/leftnavbar';


const sampleDues = [
    { id: 1, dueAmount: "$100", lastDate: "2024-09-01", status: "Paid" },
    { id: 2, dueAmount: "$200", lastDate: "2024-09-10", status: "Unpaid" },
    { id: 3, dueAmount: "$150", lastDate: "2024-09-15", status: "Paid" },
    { id: 4, dueAmount: "$250", lastDate: "2024-09-20", status: "Unpaid" },
    { id: 5, dueAmount: "$350", lastDate: "2024-09-30", status: "Unpaid" }
];


export default function PayHistory ()
{
    const [dues, setDues] = useState(sampleDues);
    const [filteredDues, setFilteredDues] = useState(sampleDues);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        let result = dues.filter(due =>
            due.dueAmount.toLowerCase().includes(search.toLowerCase()) ||
            due.lastDate.includes(search)
        );
        if (filter !== 'All') {
            result = result.filter(due => due.status === filter);
        }
        setFilteredDues(result);
    }, [search, filter, dues]);

    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <h1 className="text-3xl font-bold mb-6 text-center">My Payments</h1>
                <div className="mb-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border border-gray-300 rounded-md px-4 py-2 w-full"
                            placeholder="Search by amount or date"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                        <select
                            id="filter"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="border border-gray-300 rounded-md px-4 py-2 w-full"
                        >
                            <option value="All">All</option>
                            <option value="Paid">Paid</option>
                            <option value="Unpaid">Unpaid</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDues.map(due => (
                            <div key={due.id} className="bg-white rounded-lg p-4 shadow-md">
                                <h2 className="text-xl font-bold mb-2">Due Amount: {due.dueAmount}</h2>
                                <p className="mb-2">Last Date: {due.lastDate}</p>
                                <p className={`mb-4 ${due.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                                    Status: {due.status}
                                </p>
                                {due.status === 'Unpaid' && (
                                    <button
                                        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                                        onClick={() => window.location.href = '/payment'}
                                    >
                                        Pay Now
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                
            </div>
        </div>
    );
}

