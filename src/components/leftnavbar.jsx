import React, { useState } from 'react';
import { FaHome, FaCog, FaLifeRing, FaSignOutAlt, FaBars, FaTimes, FaIdCard, FaFileContract, FaUsers, FaNewspaper, FaClipboardList, FaInfoCircle, FaFileInvoiceDollar, FaAddressBook, FaPhoneAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { text: 'Home', icon: <FaHome className="mr-2" />, link: '/home' },
    { text: 'Membership Card', icon: <FaIdCard className="mr-2" />, link: '/membershipcard' },
    { text: 'My Union Contract', icon: <FaFileContract className="mr-2" />, link: '/unioncontract' },
    { text: 'My Union Officers', icon: <FaUsers className="mr-2" />, link: '/unionofficers' },
    { text: 'My Local Unit News', icon: <FaNewspaper className="mr-2" />, link: '/localnews' },
    { text: 'ADO', icon: <FaClipboardList className="mr-2" />, link: '/ado' },
    { text: 'Info To Go', icon: <FaInfoCircle className="mr-2" />, link: '/infotogo' },
    { text: 'My Payments', icon: <FaFileInvoiceDollar className="mr-2" />, link: '/payhistory' },
    { text: 'My Profile', icon: <FaAddressBook className="mr-2" />, link: '/profile' },
    { text: 'Contact Us', icon: <FaPhoneAlt className="mr-2" />, link: '/contact' },
    { text: 'Log Out', icon: <FaSignOutAlt className="mr-2" />, link: '/' } 
];

export default function LeftNavBar() {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('userName');
        localStorage.removeItem('wsnaid');
        window.location.href = '/';
    };

    return (
        <div className="z-50 md:flex flex-col h-screen sticky top-0 left-0 md:sticky">
            <div className={`md:hidden flex items-center justify-between p-4 ${isOpen ? 'bg-blue-400' : 'bg-white'}`}>
                <button onClick={toggleMenu} className="text-2xl">
                    {isOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            <div className={`z-50 w-80 bg-blue-400 h-full custom-scrollbar overflow-y-auto top-0 left-0 flex flex-col md:items-start p-6 ${isOpen ? 'block' : 'hidden md:block'}`}>
                <div className="flex flex-col items-center">
                    <img
                        className="h-16 w-16 rounded-full"
                        src="/pwa-512x512.png"
                        alt="Profile"
                    />
                    <h2 className="mt-4 text-white text-lg font-semibold">{localStorage.getItem('userName')}</h2>
                    <p className="text-white">WSNA ID - {localStorage.getItem('wsnaid')}</p>
                </div>

                <div className="mt-4 bg-white rounded-md flex-grow overflow-y-auto custom-scrollbar h-full">
                    {navItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.text === 'Log Out' ? '/' : item.link}
                            className={`flex m-4 items-center p-2 rounded-md ${location.pathname === item.link ? 'bg-gray-200 text-black' : 'text-gray-800 hover:text-black hover:bg-gray-200'}`}
                            onClick={item.text === 'Log Out' ? handleLogout : undefined} 
                        >
                            {item.icon}
                            {item.text}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}









/*import React, { useState } from 'react';
import { FaHome, FaCog, FaLifeRing, FaSignOutAlt, FaBars, FaTimes, FaIdCard, FaFileContract, FaUsers, FaNewspaper, FaClipboardList, FaInfoCircle, FaFileInvoiceDollar, FaAddressBook, FaPhoneAlt } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { text: 'Home', icon: <FaHome className="mr-2" />, link: '/home' },
  { text: 'Membership Card', icon: <FaIdCard className="mr-2" />, link: '/membershipcard' },
  { text: 'My Union Contract', icon: <FaFileContract className="mr-2" />, link: '/unioncontract' },
  { text: 'My Union Officers', icon: <FaUsers className="mr-2" />, link: '/unionofficers' },
  { text: 'My Local Unit News', icon: <FaNewspaper className="mr-2" />, link: '/localnews' },
  { text: 'ADO', icon: <FaClipboardList className="mr-2" />, link: '/ado' },
  { text: 'Info To Go', icon: <FaInfoCircle className="mr-2" />, link: '/infotogo' },
  { text: 'My Payments', icon: <FaFileInvoiceDollar className="mr-2" />, link: '/payhistory' },
  { text: 'My Profile', icon: <FaAddressBook className="mr-2" />, link: '/profile' },
  { text: 'Contact Us', icon: <FaPhoneAlt className="mr-2" />, link: '/contact' },
  //{ text: 'Settings', icon: <FaCog className="mr-2" />, link: '/settings' },
  //{ text: 'Support', icon: <FaLifeRing className="mr-2" />, link: '/support' },
  { text: 'Log Out', icon: <FaSignOutAlt className="mr-2" />, link: '/' }
];

export default function LeftNavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <div className="z-50 md:flex flex-col h-screen sticky top-0 left-0 md:sticky">
      <div className={`md:hidden flex items-center justify-between p-4 ${isOpen ? 'bg-blue-400' : 'bg-white'}`}>
        <button onClick={toggleMenu} className="text-2xl">
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className={`z-50 w-80 bg-blue-400 h-full custom-scrollbar overflow-y-auto top-0 left-0 flex flex-col md:items-start p-6 ${isOpen ? 'block' : 'hidden md:block'}`}>
        <div className="flex flex-col items-center">
          <img
            className="h-16 w-16 rounded-full"
            src="/pwa-512x512.png"
            alt="Profile"
          />
          <h2 className="mt-4 text-white text-lg font-semibold">{localStorage.getItem('userName')}</h2>
          <p className="text-white">WSNA ID - {localStorage.getItem('wsnaid')}</p>
        </div>

        <div className="mt-4 bg-white rounded-md flex-grow overflow-y-auto custom-scrollbar h-full">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className={`flex m-4 items-center p-2 rounded-md ${location.pathname === item.link ? 'bg-gray-200 text-black' : 'text-gray-800 hover:text-black hover:bg-gray-200'}`}
            >
              {item.icon}
              {item.text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}*/
