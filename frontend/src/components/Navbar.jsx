import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../services/api.js";
import "../styles/navbar.css";

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const getUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await api.get("/user");
      setUser(res.data.data);
    } catch (err) {
      console.error("Gagal mengambil data pengguna:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
  }, []); // Panggil saat komponen pertama kali dimuat

  // Deteksi perubahan lokasi (navigasi) untuk memastikan getUser dipanggil ulang
  useEffect(() => {
    getUser();
  }, [location.pathname]); // Panggil ulang getUser saat lokasi berubah (misalnya setelah login)

  const handleLogout = async () => {
    try {
      await api.post("/logout", {});
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("hasShownLoginPopup");
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/dashboard" className="logo-link">
          Toko Online
        </Link>
      </div>

      <div className="nav-links">
        {loading ? (
          <span>Loading...</span> // Tampilkan indikator loading (opsional)
        ) : user ? (
          <>
            {user.role === "admin" ? (
              <>
                <Link to="/admin/dashboard" className="nav-item">
                  Home
                </Link>
                <Link to="/admin/products" className="nav-item">
                  Products
                </Link>
                <Link to="/admin/orders" className="nav-item">
                  Orders
                </Link>
              </>
            ) : (
              <>
                <Link to="/customer/dashboard" className="nav-item">
                  Home
                </Link>
                <Link to="/customer/cart" className="nav-item">
                  Cart
                </Link>
                <Link to="/customer/orders" className="nav-item">
                  Order
                </Link>
              </>
            )}

            <button
              onClick={handleLogout}
              className="nav-item"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "white",
              }}
            >
              Logout
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
};

export default Navbar;