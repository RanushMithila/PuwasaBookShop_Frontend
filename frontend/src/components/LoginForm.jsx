import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";
import {
  getMachineId,
  getRegisterByDeviceId,
  createRegister,
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

  // Create a ref for the password input
  const passwordInputRef = useRef(null);

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
        } else {
          // Device not registered, create new register
          console.log("Device not registered, creating new cash register...");
          const createResponse = await createRegister(
            1,
            "POS Terminal",
            deviceId
          );
          console.log("Create register response:", createResponse);

          if (createResponse.status === true) {
            console.log(
              "Cash register created successfully:",
              createResponse.data
            );
          } else {
            console.error(
              "Failed to create cash register:",
              createResponse.error_message || createResponse.message
            );
          }
        }
      } catch (registerError) {
        console.error("Cash register check/create failed:", registerError);
        // Continue to billing even if register check fails
      }

      // Step 4: Navigate to billing page
      navigate("/billing");
    } catch (err) {
      console.error("Login failed:", err);
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
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
    </div>
  );
};

export default LoginForm;
