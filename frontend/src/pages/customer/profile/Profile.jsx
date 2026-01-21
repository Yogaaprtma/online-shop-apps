import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import "../../../styles/customer/profile.css";

const Profile = () => {
  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_telp: "",
    alamat: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const navigate = useNavigate();

  // Untuk inisial avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        setLoading(true);
        const res = await api.get("/profile");
        const u = res.data.data;
        setForm((prev) => ({
          ...prev,
          nama: u.nama || "",
          email: u.email || "",
          no_telp: u.no_telp || "",
          alamat: u.alamat || "",
        }));
      } catch (err) {
        setError("Gagal memuat profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      setSaving(true);
      const payload = {
        nama: form.nama,
        email: form.email,
        no_telp: form.no_telp,
        alamat: form.alamat,
      };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      await api.put("/profile", payload);
      setSuccessMsg("Profile berhasil diperbarui.");
      setForm((f) => ({ ...f, password: "", password_confirmation: "" }));
      
      // Auto hide success message
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      const errors = err.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join(" ")
        : err.response?.data?.message || "Gagal menyimpan profile.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Fungsi untuk navigasi
  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="profile-page-modern">
        <div className="loading-state">
          <div className="spinner-ring"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-modern">
      {/* Background decoration elements */}
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="main-content-wrapper">
        {/* Breadcrumb (Desktop Only) */}
        <nav className="desktop-breadcrumb">
          <Link to="/customer/dashboard" className="crumb-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            Dashboard
          </Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-active">Profile</span>
        </nav>

        <div className="glass-card">
          {/* Header Profile */}
          <div className="profile-header-modern">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                {getInitials(form.nama)}
              </div>
              <div className="avatar-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
              </div>
            </div>
            <div className="header-text">
              <h1>{form.nama || "Pengguna"}</h1>
              <p>Kelola data diri & keamanan akun</p>
            </div>
          </div>

          {/* Alerts */}
          <div className="alert-container">
            {error && (
              <div className="modern-alert error">
                <div className="alert-icon-box">!</div>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="modern-alert success">
                <div className="alert-icon-box">✓</div>
                <span>{successMsg}</span>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="modern-form">
            <div className="form-sections-grid">
              
              {/* Kolom Kiri: Info Pribadi */}
              <div className="form-section">
                <div className="section-title">
                  <span className="icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <h3>Informasi Pribadi</h3>
                </div>

                <div className="input-group">
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={onChange}
                    placeholder="Nama Lengkap Anda"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="email@contoh.com"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>No. Telepon</label>
                  <input
                    type="text"
                    name="no_telp"
                    value={form.no_telp}
                    onChange={onChange}
                    placeholder="08xxxxxxxx"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Alamat Lengkap</label>
                  <textarea
                    name="alamat"
                    value={form.alamat}
                    onChange={onChange}
                    placeholder="Jalan, No. Rumah, Kota..."
                    rows="3"
                    required
                  />
                </div>
              </div>

              {/* Kolom Kanan: Keamanan */}
              <div className="form-section security-section">
                <div className="section-title">
                  <span className="icon-wrap warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </span>
                  <h3>Keamanan (Opsional)</h3>
                </div>

                <div className="info-box">
                  <small>Kosongkan jika tidak ingin mengubah password.</small>
                </div>

                <div className="input-group">
                  <label>Password Baru</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••••"
                  />
                </div>

                <div className="input-group">
                  <label>Konfirmasi Password</label>
                  <input
                    type="password"
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={onChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="form-footer">
              <button type="submit" className="btn-save-modern" disabled={saving}>
                {saving ? (
                  <span className="loading-dots">Menyimpan<span>.</span><span>.</span><span>.</span></span>
                ) : (
                  <>
                    Simpan Perubahan
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Navigation (sama seperti di DashboardCustomer) */}
      <div className="bottom-nav">
        <div className="bottom-nav-container">
          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/dashboard')}
          >
            <svg 
              className="bottom-nav-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span className="bottom-nav-label">Home</span>
          </button>

          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/products' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/products')}
          >
            <svg 
              className="bottom-nav-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            <span className="bottom-nav-label">Produk</span>
          </button>

          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/cart' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/cart')}
          >
            <svg 
              className="bottom-nav-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="bottom-nav-label">Keranjang</span>
          </button>

          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/orders' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/orders')}
          >
            <svg 
              className="bottom-nav-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span className="bottom-nav-label">Pesanan</span>
          </button>

          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/profile' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/profile')}
          >
            <svg 
              className="bottom-nav-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span className="bottom-nav-label">Profil</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;