import { HashRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import BillingPage from "../pages/BillingPage";
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
      </Routes>
    </HashRouter>
  );
};

export default AppRoutes;
