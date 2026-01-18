import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";
import {
  getMachineId,
  getRegisterByDeviceId,
  createRegister,
  getAllLocations,
} from "../services/CashRegisterService";
import useAuthStore from "../store/AuthStore";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setDeviceId = useAuthStore((state) => state.setDeviceId);

  // Cash register popup state
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [currentDeviceId, setCurrentDeviceId] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Create a ref for the password input
  const passwordInputRef = useRef(null);

  // Fetch locations when popup opens
  useEffect(() => {
    if (showRegisterPopup) {
      fetchLocations();
    }
  }, [showRegisterPopup]);

  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const response = await getAllLocations();
      console.log("Locations fetched:", response);
      if (response.status === true && response.data) {
        setLocations(response.data);
        // Set default selection to first location if available
        if (response.data.length > 0) {
          setSelectedLocationId(response.data[0].LocationID);
        }
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
      setRegisterError("Failed to load locations. Please try again.");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Authenticate user
      const { access_token, refresh_token } = await login(username, password);
      setTokens(access_token, refresh_token);
      console.log("Login successful, tokens stored");

      // Step 2: Get machine ID
      let deviceId;
      try {
        deviceId = await getMachineId();
        console.log("Device ID fetched:", deviceId);
      } catch (machineIdError) {
        console.error("Failed to get machine ID:", machineIdError);
        // In non-Electron environment, generate a fallback ID
        deviceId = `web-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;
        console.log("Using fallback device ID:", deviceId);
      }

      // Store device ID in auth store
      setDeviceId(deviceId);
      setCurrentDeviceId(deviceId);

      // Step 3: Check if device is registered as cash register
      try {
        const registerResponse = await getRegisterByDeviceId(deviceId);
        console.log("Cash register check response:", registerResponse);

        if (registerResponse.status === true) {
          // Device is already registered
          console.log(
            "Device is registered as cash register:",
            registerResponse.data
          );
          // Navigate to billing page
          navigate("/billing");
        } else {
          // Device not registered, show popup for registration
          console.log("Device not registered. Showing registration popup...");
          console.log("Complete bill response:", registerResponse);
          setShowRegisterPopup(true);
        }
      } catch (registerError) {
        console.error("Cash register check failed:", registerError);
        // Show popup for registration on error as well
        setShowRegisterPopup(true);
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setRegisterError("");

    if (!selectedLocationId) {
      setRegisterError("Please select a location.");
      return;
    }
    if (!registerName.trim()) {
      setRegisterError("Please enter a register name.");
      return;
    }

    setIsRegistering(true);

    try {
      const createResponse = await createRegister(
        selectedLocationId,
        registerName.trim(),
        currentDeviceId
      );
      console.log("Create register response:", createResponse);

      if (createResponse.status === true) {
        console.log("Cash register created successfully:", createResponse.data);
        setShowRegisterPopup(false);
        // Navigate to billing page after successful registration
        navigate("/billing");
      } else {
        setRegisterError(
          createResponse.error_message ||
            createResponse.message ||
            "Failed to register cash register."
        );
      }
    } catch (error) {
      console.error("Failed to create cash register:", error);
      setRegisterError("Failed to register device. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancelRegistration = () => {
    setShowRegisterPopup(false);
    setRegisterName("");
    setSelectedLocationId("");
    setRegisterError("");
  };

  // Handle Enter key press in username field
  const handleUsernameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      passwordInputRef.current?.focus(); // Focus password field
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-32 px-4">
      <h1 className="text-2xl font-bold text-center mb-6">Puwasa Book Shop</h1>
      <h2 className="text-lg font-semibold text-center mb-2">Log in</h2>
      <p className="text-sm text-center text-gray-600 mb-6">
        Steal the credentials and <br /> make your path to success
      </p>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleUsernameKeyDown}
          className="w-full border rounded px-4 py-2 text-sm"
          disabled={isLoading}
        />
        <input
          ref={passwordInputRef}
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-4 py-2 text-sm"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="text-xs text-center text-gray-500 mt-4 px-4">
        By clicking continue, you agree to our{" "}
        <span className="underline cursor-pointer">Terms of Service</span> and{" "}
        <span className="underline cursor-pointer">Privacy Policy</span>
      </p>

      {/* Cash Register Registration Popup */}
      {showRegisterPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Register Cash Register
              </h3>
              <button
                onClick={handleCancelRegistration}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Device not registered.</strong> This device needs to be
                registered as a cash register before proceeding.
              </p>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-4">
              <div>
                <label
                  htmlFor="location-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <select
                  id="location-select"
                  value={selectedLocationId}
                  onChange={(e) =>
                    setSelectedLocationId(Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoadingLocations || isRegistering}
                >
                  {isLoadingLocations ? (
                    <option value="">Loading locations...</option>
                  ) : locations.length === 0 ? (
                    <option value="">No locations available</option>
                  ) : (
                    locations.map((location) => (
                      <option
                        key={location.LocationID}
                        value={location.LocationID}
                      >
                        {location.LocationName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="register-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Register Name
                </label>
                <input
                  type="text"
                  id="register-name"
                  placeholder="Enter register name (e.g., POS Terminal 1)"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isRegistering}
                />
              </div>

              {registerError && (
                <p className="text-red-500 text-sm">{registerError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={
                    isRegistering || isLoadingLocations || !selectedLocationId
                  }
                >
                  {isRegistering ? "Registering..." : "Register Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
