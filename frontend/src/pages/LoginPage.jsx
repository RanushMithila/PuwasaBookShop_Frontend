import { useEffect, useState } from "react";
import LoginForm from "../components/LoginForm";
import {
  getMachineId,
  checkRegisterClosed,
} from "../services/CashRegisterService";
import loginIllustration from "../assets/login_illustration.png";

const LoginPage = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        let deviceId;
        try {
          deviceId = await getMachineId();
        } catch (e) {
          // Fallback or ignore for web
          setIsLoading(false);
          return;
        }

        const response = await checkRegisterClosed(deviceId);
        if (response.status === true && response.data) {
          // New logic: if isClosed is true, block the login
          if (response.data.isClosed === true) {
            setIsBlocked(true);
            setErrorMessage(
              "Access Denied: This cash register is currently CLOSED. Please contact an administrator to open the register for this device.",
            );
          } else {
            // isClosed is false, so it's open - allow login
            setIsBlocked(false);
          }
        }
      } catch (error) {
        console.error("Error checking register status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-w-md w-full border-t-8 border-red-500 animate-fade-in text-center">
          <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
                strokeWidth={2}
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">
            POS Endpoint Closed
          </h2>

          <p className="text-gray-600 leading-relaxed mb-8 text-lg font-medium">
            {errorMessage}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(220,38,38,0.3)] flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex font-sans">
      {/* Left Side (Blue Background with Illustration) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#255288] p-12 text-white relative overflow-hidden z-10 shadow-[20px_0_30px_-15px_rgba(0,0,0,0.2)]">
        {/* Background Image that covers the entire left side to hide mismatched borders */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={loginIllustration} 
            alt="Illustration Background" 
            className="w-full h-full object-cover opacity-100" 
          />
        </div>
        
        {/* Decorative overlay to ensure text is readable if needed */}
        <div className="absolute inset-0 bg-blue-900/10 pointer-events-none"></div>
        
        <div className="z-10 mt-8">
          {/* Header placeholder if needed */}
        </div>
        
        {/* We removed the inner illustration since we made it the cover background, 
            but if you want it centered rather than covered:
            You can use object-cover for the full background. */}

      </div>
      
      {/* Right Side (Form) */}
      <div className="w-full lg:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center bg-white">
        <LoginForm />
      </div>

    </div>
  );
};

export default LoginPage;
