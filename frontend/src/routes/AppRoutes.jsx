import { HashRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import BillingPage from '../pages/BillingPage';

const AppRoutes = () => {
  return (

      <HashRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Routes>
      </HashRouter>

  );
};

export default AppRoutes;