import React from 'react';
import { Link } from 'react-router-dom'; 
import { FaIdCard, FaFileContract, FaUsers, FaNewspaper, FaClipboardList, FaInfoCircle, FaFileInvoiceDollar, FaAddressBook, FaPhoneAlt } from 'react-icons/fa';
import LeftNavBar from '../components/leftnavbar';

const buttons = [
    { text: 'Membership Card', icon: <FaIdCard size={30} />, link: '/membershipcard', buttonColor: '#C6D8FF' },  // Light Blue
    { text: 'My Union Contract', icon: <FaFileContract size={30} />, link: '/unioncontract', buttonColor: '#FFEBCC' },  // Light Yellow
    { text: 'My Union Officers', icon: <FaUsers size={30} />, link: '/unionofficers', buttonColor: '#D1F7D1' },  // Light Green
    { text: 'My Local Unit News', icon: <FaNewspaper size={30} />, link: '/localnews', buttonColor: '#FFCCCB' },  // Light Red
    { text: 'ADO', icon: <FaClipboardList size={30} />, link: '/ado', buttonColor: '#FFEBF0' },  // Light Pink
    { text: 'Info To Go', icon: <FaInfoCircle size={30} />, link: '/infotogo', buttonColor: '#F1F1F1' },  // Light Gray
    { text: 'My Payments', icon: <FaFileInvoiceDollar size={30} />, link: '/payhistory', buttonColor: '#E6F7FF' },  // Light Cyan
    { text: 'My Profile', icon: <FaAddressBook size={30} />, link: '/profile', buttonColor: '#F4F0D2' },  // Light Beige
    { text: 'Contact Us', icon: <FaPhoneAlt size={30} />, link: '/contact', buttonColor: '#FFEDDA' }  // Light Peach
    /*{ text: 'Membership Card', icon: <FaIdCard size={30} />, link: '/membershipcard', buttonColor: '#4FB3FF' },  // Bright Blue
    { text: 'My Union Contract', icon: <FaFileContract size={30} />, link: '/unioncontract', buttonColor: '#FFB74D' },  // Bright Orange
    { text: 'My Union Officers', icon: <FaUsers size={30} />, link: '/unionofficers', buttonColor: '#81C784' },  // Bright Green
    { text: 'My Local Unit News', icon: <FaNewspaper size={30} />, link: '/localnews', buttonColor: '#FF8A80' },  // Bright Red
    { text: 'ADO', icon: <FaClipboardList size={30} />, link: '/ado', buttonColor: '#FF80AB' },  // Bright Pink
    { text: 'Info To Go', icon: <FaInfoCircle size={30} />, link: '/infotogo', buttonColor: '#F4B400' },  // Bright Yellow
    { text: 'My Payments', icon: <FaFileInvoiceDollar size={30} />, link: '/payhistory', buttonColor: '#00E676' },  // Bright Cyan
    { text: 'My Profile', icon: <FaAddressBook size={30} />, link: '/profile', buttonColor: '#FFD54F' },  // Bright Amber
    { text: 'Contact Us', icon: <FaPhoneAlt size={30} />, link: '/contact', buttonColor: '#FFEE58' },  // Bright Lemon Yellow*/
];

export default function HomePage() {
    return (
        <div className="flex">
            <LeftNavBar />
            <div className="flex-1 p-6">
                <div className="text-center mb-4">
                    <h1 className="text-4xl font-bold">WSNA</h1>
                </div>
                <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-3 place-items-center ml-5 mr-5 mt-10">
                    {buttons.map((button, index) => (
                        <Link
                            key={index}
                            to={button.link}
                            className="p-4 rounded-lg shadow-lg w-full h-40 flex flex-col justify-center items-center transition-transform transform hover:scale-105"
                            style={{
                                backgroundImage: button.bgImage ? `url(${button.bgImage})` : 'none',
                                backgroundColor: button.bgImage ? 'rgba(0, 0, 0, 0.4)' : button.buttonColor,
                                backgroundBlendMode : button.bgImage ? 'multiply' : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        >
                            {button.icon}
                            <span className="mt-2">{button.text}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
