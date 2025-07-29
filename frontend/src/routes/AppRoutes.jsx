import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import BillingPage from '../pages/BillingPage';

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/billing" element={<BillingPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
