import React, { useState } from "react";
import "../Login/Login.css";
import { useNavigate } from "react-router";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          security_answer: securityAnswer,
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Error resetting password");
        return;
      }

      alert("Password reset successful. Please login.");
      window.location.href = "/login";
    } catch (err) {
      alert("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="container" id="container">
      <form onSubmit={handleSubmit}>
        <h1>Forgot Password</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Your Favorite Dish"
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
