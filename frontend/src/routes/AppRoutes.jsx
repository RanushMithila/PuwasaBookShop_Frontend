import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import BillingPage from "../pages/BillingPage";
import RefundPage from "../pages/RefundPage";
import CustomerPage from "../pages/CustomerPage";
import Layout from "../components/Layout";

const AppRoutes = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Login page without sidebar */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes with sidebar layout */}
        <Route
          path="/billing"
          element={
            <Layout>
              <BillingPage />
            </Layout>
          }
        />
        <Route
          path="/refund"
          element={
            <Layout>
              <RefundPage />
            </Layout>
          }
        />
        <Route
          path="/customer"
          element={
            <Layout>
              <CustomerPage />
            </Layout>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
