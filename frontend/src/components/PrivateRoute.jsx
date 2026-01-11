import { Navigate } from "react-router-dom";
import api from "../services/api";
import { useEffect, useState } from "react";

const PrivateRoute = ({ children, role }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await api.get("/profile"); // Endpoint untuk mendapatkan data pengguna
        const userRole = response.data.data.role;
        setIsAuthorized(userRole === role);
      } catch (err) {
        setIsAuthorized(false);
      }
    };
    checkRole();
  }, [role]);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
};

export default PrivateRoute;