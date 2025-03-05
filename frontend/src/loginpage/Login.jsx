import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API}/user/verifytoken`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );

        if (response.ok) {
          navigate("/dashboard");
        } else {
          throw new Error("Invalid token");
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.clear();
      }
    };

    checkTokenValidity();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!emailPattern.test(email)) {
      setEmailError("Please enter a valid Gmail address.");
      return;
    }

    if (!password) {
      setPasswordError("Password is required.");
      return;
    }

    setEmailError("");
    setPasswordError("");
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API}/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, pswd: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setEmailError(data.message || "Failed to log in.");
      }
    } catch (error) {
      setEmailError("Network error. Please try again.");
      console.error("Error logging in:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center flex-col justify-center min-h-screen bg-gray-100 font-primary">
      <div>
        <h2 className="text-3xl font-bold mb-10 text-blue-600">
          Welcome to Co-attainment Portal
        </h2>
      </div>
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-6 text-center">Login with Gmail</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="mb-4">
            <label className="block text-gray-700">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 border w-full rounded"
              disabled={loading}
              autoComplete="off"
            />
            {emailError && <p className="text-red-500 mt-2">{emailError}</p>}
          </div>
          <div className="mb-4 relative">
            <label className="block text-gray-700">Password:</label>
            <input
              type= "password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 p-2 border w-full rounded pr-10"
              disabled={loading}
              autoComplete="off"
              onPaste={(e) => e.preventDefault()}
            />
            {passwordError && <p className="text-red-500 mt-2">{passwordError}</p>}
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className={`border-2 border-none bg-green-600 text-xl text-white p-2 rounded-md ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
