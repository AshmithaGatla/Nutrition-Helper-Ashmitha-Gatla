import { useEffect } from "react";
import { useNavigate } from "react-router";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      await fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.removeItem("token");
      window.location.href = "/login";
    };

    logout();
  }, [navigate]);

  return null;
};

export default Logout;
