import React, { useState } from "react";
import { useNavigate } from "react-router";
import "./Login.css";

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [security_answer, setSecurityAnswer] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isSignUp ? "/signup" : "/login";
    const credentials = isSignUp
      ? { email, password, name, security_answer }
      : { email, password };

    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        // Try to parse the error message from the response body
        const responseData = await response.text();
        let errorMessage = "An error occurred"; // Default error message

        try {
          const parsed = JSON.parse(responseData);
          errorMessage = parsed.message || "An error occurred";
        } catch (err) {
          // Handle the case where the response is not valid JSON
          console.error("Error parsing response:", err);
          errorMessage = "Invalid response from server";
        }

        alert(errorMessage); // Show the error message
        window.location.href = "/login";
        return;
      }

      if (isSignUp) {
        alert("Sign up done successfully. Please login.");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);
      window.location.href = "/";
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  const toggleSignUp = () => setIsSignUp(!isSignUp);

  return (
    <div className="login-page-wrapper">
      <div
        className={`container ${isSignUp ? "right-panel-active" : ""}`}
        id="container"
      >
        {/* Sign Up Form */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleSubmit}>
            <h1>Nutrition Helper</h1>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Your Favorite Dish (Security Answer)"
              value={security_answer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
            />
            <br></br>
            <button type="submit">Sign Up</button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className="form-container sign-in-container">
          <form onSubmit={handleSubmit}>
            <h1>Nutrition Helper</h1>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p
              style={{
                marginTop: "10px",
                marginBottom: "5px",
                cursor: "pointer",
                color: "#3498db",
                textDecoration: "underline",
                fontSize: "14px",
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </p>

            <br></br>
            <button type="submit">Login</button>
          </form>
        </div>

        {/* Overlay for switching */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us, please login with your personal info
              </p>
              <button className="ghost" onClick={toggleSignUp}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button className="ghost" onClick={toggleSignUp}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
