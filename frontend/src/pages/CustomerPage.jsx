import { useState, useRef, useEffect, forwardRef } from "react";
import { registerCustomer } from "../services/CustomerService";
import AlertModal from "../components/AlertModal";

// Defined outside to avoid re-creation on every render (which causes focus loss)
const InputField = forwardRef(({ label, name, type = "text", placeholder, required = false, value = "", onChange, onBlur }, ref) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    <input
      ref={ref}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400 bg-white"
    />
  </div>
));
InputField.displayName = "InputField";

const CustomerPage = () => {
  const firstnameRef = useRef();

  const initialForm = {
    firstname: "",
    lastname: "",
    phone: "",
    dateOfBirth: "",
    Email: "",
    Password: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    province: "",
    country: "",
    active: true,
    role: "Customer",
  };

  const [form, setForm] = useState({ ...initialForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordManuallyEdited, setPasswordManuallyEdited] = useState(false);

  // Helper: generate password from name + today's date
  const generatePassword = (name) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${name}${yyyy}${mm}${dd}`;
  };

  // Alert Modal
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    const t = setTimeout(() => firstnameRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "Password") {
      setPasswordManuallyEdited(true);
      setForm((prev) => ({ ...prev, Password: value }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

  };

  // Generate password when user leaves the firstname field
  const handleFirstnameBlur = () => {
    if (!passwordManuallyEdited && form.firstname.trim()) {
      setForm((prev) => ({ ...prev, Password: generatePassword(prev.firstname) }));
    }
  };

  const handleToggleActive = () => {
    setForm((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.firstname.trim() || !form.lastname.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Missing Information",
        message: "First name and last name are required.",
        type: "error",
      });
      return;
    }
    if (!form.phone.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Missing Information",
        message: "Phone number is required.",
        type: "error",
      });
      return;
    }
    if (!form.Email.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Missing Information",
        message: "Email is required.",
        type: "error",
      });
      return;
    }
    if (!form.Password.trim()) {
      setAlertConfig({
        isOpen: true,
        title: "Missing Information",
        message: "Password is required.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth || new Date().toISOString().split("T")[0],
      };
      const resp = await registerCustomer(payload);
      if (resp && resp.status === true) {
        setAlertConfig({
          isOpen: true,
          title: "Success",
          message: resp.message || "Customer registered successfully!",
          type: "success",
        });
        // Reset form
        setForm({ ...initialForm });
        setPasswordManuallyEdited(false);
        setTimeout(() => firstnameRef.current?.focus(), 0);
      } else {
        setAlertConfig({
          isOpen: true,
          title: "Registration Failed",
          message:
            resp?.error_message || resp?.message || "Could not register customer.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Customer registration failed:", err);
      setAlertConfig({
        isOpen: true,
        title: "Error",
        message: err.message || "Failed to register customer.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setForm({ ...initialForm });
    setPasswordManuallyEdited(false);
    setTimeout(() => firstnameRef.current?.focus(), 0);
  };

  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, isOpen: false });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden w-full bg-gray-50">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span className="text-2xl">👤</span> Customer Registration
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Register a new customer account
        </p>
      </div>

      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl">
          {/* Personal Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                ref={firstnameRef}
                label="First Name"
                name="firstname"
                placeholder="Enter first name"
                required
                value={form.firstname}
                onChange={handleChange}
                onBlur={handleFirstnameBlur}
              />
              <InputField
                label="Last Name"
                name="lastname"
                placeholder="Enter last name"
                required
                value={form.lastname}
                onChange={handleChange}
              />
              <InputField
                label="Phone"
                name="phone"
                type="tel"
                placeholder="Enter phone number"
                required
                value={form.phone}
                onChange={handleChange}
              />
              <InputField
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Account Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Email"
                name="Email"
                type="email"
                placeholder="Enter email address"
                required
                value={form.Email}
                onChange={handleChange}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password<span className="text-red-400 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="Password"
                    value={form.Password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Address Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InputField
                label="Address Line 1"
                name="address1"
                placeholder="Street address"
                value={form.address1}
                onChange={handleChange}
              />
              <InputField
                label="Address Line 2"
                name="address2"
                placeholder="Apartment, suite, etc."
                value={form.address2}
                onChange={handleChange}
              />
              <InputField
                label="Address Line 3"
                name="address3"
                placeholder="Additional address"
                value={form.address3}
                onChange={handleChange}
              />
              <InputField
                label="City"
                name="city"
                placeholder="Enter city"
                value={form.city}
                onChange={handleChange}
              />
              <InputField
                label="Province"
                name="province"
                placeholder="Enter province"
                value={form.province}
                onChange={handleChange}
              />
              <InputField
                label="Country"
                name="country"
                placeholder="Enter country"
                value={form.country}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Status & Role */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Status & Role
            </h2>
            <div className="flex flex-wrap items-center gap-8">
              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Active Status
                </label>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${
                    form.active ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      form.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    form.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Role (read-only) */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700">
                  {form.role}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-3 rounded-lg text-white text-sm font-semibold transition shadow-sm ${
                isSubmitting
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] hover:shadow-md"
              }`}
            >
              {isSubmitting ? "Registering…" : "Register Customer"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-8 py-3 rounded-lg text-gray-700 text-sm font-medium border border-gray-300 hover:bg-gray-100 transition active:scale-[0.98]"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={handleCloseAlert}
      />
    </div>
  );
};

export default CustomerPage;
