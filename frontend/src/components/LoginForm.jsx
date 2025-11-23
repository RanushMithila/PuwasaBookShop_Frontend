import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/AuthService";
import useAuthStore from "../store/AuthStore";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);

  // Create a ref for the password input
  const passwordInputRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { access_token, refresh_token } = await login(username, password);
      setTokens(access_token, refresh_token);
      navigate("/billing");
    } catch (err) {
      setError("Invalid username or password");
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
        />
        <input
          ref={passwordInputRef}
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-4 py-2 text-sm"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded text-sm hover:bg-green-600"
        >
          Log in
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
