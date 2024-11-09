import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './pages/login';
import NotFound from './pages/notfound';
import Success from './pages/success';
import ResetPassword from './pages/resetpassword';
import HomePage from './pages/home';
import PaymentPage from './pages/payment';
import SettingsPage from './pages/settings';
import SupportPage from './pages/support';
import PayHistory from './pages/paymenthistory';
import MembershipCard from './pages/membershipcard';
import UnionContract from './pages/unioncontract';
import UnionOfficers from './pages/unionofficers';
import LocalNews from './pages/localnews';
import ADO from './pages/ado';
import InfoToGo from './pages/infotogo';
import Profile from './pages/profile';
import Contact from './pages/contact';
import ProtectedRoute from './components/protectedroute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LoginSignup />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        {/*Protected Routes Below*/}
        <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
        <Route path="/payhistory" element={<ProtectedRoute><PayHistory /></ProtectedRoute>} />
        <Route path="/membershipcard" element={<ProtectedRoute><MembershipCard /></ProtectedRoute>} />
        <Route path="/unioncontract" element={<ProtectedRoute><UnionContract /></ProtectedRoute>} />
        <Route path="/unionofficers" element={<ProtectedRoute><UnionOfficers /></ProtectedRoute>} />
        <Route path="/localnews" element={<ProtectedRoute><LocalNews /></ProtectedRoute>} />
        <Route path="/ado" element={<ProtectedRoute><ADO /></ProtectedRoute>} />
        <Route path="/infotogo" element={<ProtectedRoute><InfoToGo /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;







/*import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './pages/login';
import NotFound from './pages/notfound';
import Success from './pages/success';
import ResetPassword from './pages/resetpassword';
import HomePage from './pages/home';
import PaymentPage from './pages/payment';
import SettingsPage from './pages/settings';
import SupportPage from './pages/support';
import PayHistory from './pages/paymenthistory';
import MembershipCard from './pages/membershipcard';
import UnionContract from './pages/unioncontract';
import UnionOfficers from './pages/unionofficers';
import LocalNews from './pages/localnews';
import ADO from './pages/ado';
import InfoToGo from './pages/infotogo';
import Profile from './pages/profile';
import Contact from './pages/contact';
import ProtectedRoute from './components/protectedroute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LoginSignup />} />
        <Route path="*" element={<NotFound />} />
        <ProtectedRoute>
          <Route path="/success" element={<Success />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/payhistory" element={<PayHistory />} />
          <Route path="/membershipcard" element={<MembershipCard />} />
          <Route path="/unioncontract" element={<UnionContract />} />
          <Route path="/unionofficers" element={<UnionOfficers />} />
          <Route path="/localnews" element={<LocalNews />} />
          <Route path="/ado" element={<ADO />} />
          <Route path="/infotogo" element={<InfoToGo />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/contact" element={<Contact />} />
        </ProtectedRoute>
      </Routes>
    </Router>
  );
}

export default App;*/
