import { HashRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import BillingPage from '../pages/BillingPage';
import CategoryManagementPage from '../pages/CategoryManagementPage';
import LocationManagementPage from '../pages/LocationManagementPage';
import ItemManagementPage from '../pages/ItemManagementPage';
import Layout from '../components/Layout';

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Login page without sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes with sidebar layout */}
        <Route path="/billing" element={
          <Layout>
            <BillingPage />
          </Layout>
        } />
        <Route path="/categories" element={
          <Layout>
            <CategoryManagementPage />
          </Layout>
        } />
        <Route path="/locations" element={
          <Layout>
            <LocationManagementPage />
          </Layout>
        } />
        <Route path="/items" element={
          <Layout>
            <ItemManagementPage />
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;