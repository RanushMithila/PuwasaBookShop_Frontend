import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, getProfile, getCurrentUser } from "../services/AuthService";
import { getTenantInfo } from "../services/TenantService";
import { getUsers } from "../services/UserService";
import { getLocationById } from "../services/BillingService";
import {
  getMachineId,
  getRegisterByDeviceId,
  createRegister,
  getAllLocations,
  listCashRegisters,
} from "../services/CashRegisterService";
import useAuthStore from "../store/AuthStore";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setDeviceId = useAuthStore((state) => state.setDeviceId);
  const setSession = useAuthStore((state) => state.setSession);
  const setTenantInfo = useAuthStore((state) => state.setTenantInfo);
  const setCurrentUserName = useAuthStore((state) => state.setCurrentUserName);
  const setLocationData = useAuthStore((state) => state.setLocationData);

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

      // Fetch tenant info and user display name in parallel (non-blocking)
      // These are stored in AuthStore for use in billing/receipts
      try {
        const [tenantResp, userResp, usersResp] = await Promise.allSettled([
          getTenantInfo(),
          getCurrentUser(),
          getUsers(),
        ]);

        // Store tenant info
        if (tenantResp.status === "fulfilled" && tenantResp.value?.status === true && tenantResp.value?.data) {
          const t = tenantResp.value.data;
          setTenantInfo({
            tenant_name: t.tenant_name || "",
            contact_email: t.contact_email || "",
            contact_phone: t.contact_phone || "",
            city: t.city || "",
          });
          console.log("[LoginForm] Tenant info stored:", t.tenant_name);
        } else {
          console.warn("[LoginForm] Could not fetch tenant info");
        }

        // Determine user display name by matching UserID from /user/me against /user/users
        let displayName = null;
        const currentUserId =
          userResp.status === "fulfilled" && userResp.value?.status === true && userResp.value?.data
            ? userResp.value.data.UserID
            : null;
        const userEmail =
          userResp.status === "fulfilled" && userResp.value?.data?.Email
            ? userResp.value.data.Email
            : null;

        if (currentUserId && usersResp.status === "fulfilled" && usersResp.value?.status === true && Array.isArray(usersResp.value.data)) {
          const matchedUser = usersResp.value.data.find((u) => u.UserID === currentUserId);
          if (matchedUser) {
            const fname = matchedUser.firstname || "";
            const lname = matchedUser.lastname || "";
            const fullName = `${fname} ${lname}`.trim();
            displayName = fullName || matchedUser.Email || userEmail;
          }
        }

        // Fallback to email from /user/me if no name found
        if (!displayName) {
          displayName = userEmail || username;
        }

        setCurrentUserName(displayName);
        console.log("[LoginForm] User display name stored:", displayName);
      } catch (fetchErr) {
        console.warn("[LoginForm] Non-critical: Failed to fetch tenant/user info:", fetchErr);
      }

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
            registerResponse.data,
          );

          // First, try to use locationID directly from getRegisterByDeviceId response
          let registerLocationId = null;
          let registerName = null;

          if (registerResponse.data) {
            // The getRegisterByDeviceId response may contain locationID directly
            registerLocationId =
              registerResponse.data.locationID ||
              registerResponse.data.LocationID ||
              registerResponse.data.location_id;
            registerName =
              registerResponse.data.registerName ||
              registerResponse.data.RegisterName ||
              registerResponse.data.register_name;
            console.log(
              "LocationID from getRegisterByDeviceId:",
              registerLocationId,
            );
          }

          // If not found in direct response, try listCashRegisters as fallback
          if (!registerLocationId) {
            try {
              const registersResp = await listCashRegisters();
              if (
                registersResp.status === true &&
                registersResp.data?.cashRegisters
              ) {
                // Try multiple field names for matching
                const myRegister = registersResp.data.cashRegisters.find(
                  (r) =>
                    r.cashRegisterID === deviceId ||
                    r.deviceID === deviceId ||
                    r.DeviceID === deviceId,
                );
                if (myRegister) {
                  console.log("Matched register from list:", myRegister);
                  registerLocationId =
                    myRegister.locationID || myRegister.LocationID;
                  registerName =
                    registerName ||
                    myRegister.registerName ||
                    myRegister.RegisterName;
                  console.log(
                    "Register locationID from list:",
                    registerLocationId,
                  );
                }
              }
            } catch (listErr) {
              console.error("Failed to fetch registers list:", listErr);
            }
          }

          // Update session with the found locationID
          if (registerLocationId) {
            // Fetch location details (name, address, city) — single API call for both
            let resolvedLocationName = "";
            try {
              const locData = await getLocationById(registerLocationId);
              console.log("[LoginForm] Location data fetched:", locData);
              setLocationData(locData);
              resolvedLocationName = locData?.displayName || locData?.locationName || locData?.LocationName || "";
            } catch (locDataErr) {
              console.warn("[LoginForm] Could not fetch location data:", locDataErr);
            }

            try {
              const profile = await getProfile();
              console.log("Using LocationID:", registerLocationId);
              setSession({
                user: profile.user || profile,
                location: {
                  id: registerLocationId,
                  name: registerName || "Unknown Register",
                },
                LocationID: registerLocationId,
                locationName: resolvedLocationName,
              });
            } catch (profileErr) {
              console.error("Failed to fetch profile:", profileErr);
              // Still set the LocationID even if profile fetch fails
              setSession({
                user: null,
                location: {
                  id: registerLocationId,
                  name: registerName || "Unknown Register",
                },
                LocationID: registerLocationId,
                locationName: resolvedLocationName,
              });
            }
          } else {
            console.error("Could not determine LocationID for this device!");
          }

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
        currentDeviceId,
      );
      console.log("Create register response:", createResponse);

      if (createResponse.status === true) {
        console.log("Cash register created successfully:", createResponse.data);

        // Fetch user profile and update session in store
        try {
          const profile = await getProfile();
          // Look up the selected location name from the already-fetched locations array
          const selectedLoc = locations.find(
            (l) => l.LocationID === parseInt(selectedLocationId, 10) || l.LocationID === selectedLocationId,
          );
          setSession({
            user: profile.user || profile,
            location: {
              id: parseInt(selectedLocationId, 10),
              name: registerName.trim(),
            },
            LocationID: parseInt(selectedLocationId, 10),
            locationName: selectedLoc?.LocationName || "",
          });
        } catch (profileErr) {
          console.error(
            "Failed to fetch profile after registration:",
            profileErr,
          );
        }

        setShowRegisterPopup(false);
        // Navigate to billing page after successful registration
        navigate("/billing");
      } else {
        setRegisterError(
          createResponse.error_message ||
          createResponse.message ||
          "Failed to register cash register.",
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
    <div className="w-full flex flex-col h-full justify-center">
      {/* Logo Placeholder */}
      <div className="mb-12 flex justify-center lg:justify-start">
        <div className="flex items-center text-4xl font-extrabold tracking-tight">
          <span className="text-[#3B82F6]">Prime</span>
          <span className="text-gray-800">Register</span>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto lg:mx-0">
        <h2 className="text-3xl font-bold text-gray-800 mb-10 text-center lg:text-left">Sign in</h2>

        <form onSubmit={handleLogin} className="space-y-8">

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase">
              Email
            </label>
            <input
              type="text"
              placeholder="Enter Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleUsernameKeyDown}
              className="w-full border-b border-gray-300 px-0 py-2 text-sm text-gray-800 bg-transparent focus:outline-none focus:border-[#3B82F6] transition-colors"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2 relative">
            <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase">
              PASSWORD
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-gray-300 px-0 py-2 pr-10 text-sm text-gray-800 bg-transparent focus:outline-none focus:border-[#3B82F6] transition-colors tracking-widest placeholder:tracking-normal"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end pt-8">
            <button
              type="submit"
              className="bg-[#3B82F6] text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
              {!isLoading && (
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* Cash Register Registration Popup */}
      {showRegisterPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                Register Device
              </h3>
              <button
                onClick={handleCancelRegistration}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex gap-3">
                <svg className="w-6 h-6 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-800">
                  This device needs to be registered as a cash register before proceeding.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterDevice} className="space-y-5">
              <div>
                <label htmlFor="location-select" className="block text-sm font-bold text-gray-700 mb-2">
                  Location
                </label>
                <select
                  id="location-select"
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                  disabled={isLoadingLocations || isRegistering}
                >
                  {isLoadingLocations ? (
                    <option value="">Loading locations...</option>
                  ) : locations.length === 0 ? (
                    <option value="">No locations available</option>
                  ) : (
                    locations.map((location) => (
                      <option key={location.LocationID} value={location.LocationID}>
                        {location.LocationName}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="register-name" className="block text-sm font-bold text-gray-700 mb-2">
                  Register Name
                </label>
                <input
                  type="text"
                  id="register-name"
                  placeholder="e.g., POS Terminal 1"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition-colors"
                  disabled={isRegistering}
                />
              </div>

              {registerError && (
                <p className="text-red-500 text-sm font-medium">{registerError}</p>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelRegistration}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                  disabled={isRegistering}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#3B82F6] text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                  disabled={isRegistering || isLoadingLocations || !selectedLocationId}
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

