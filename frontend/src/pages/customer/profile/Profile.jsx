import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  if (loading) {
    return (
      <div className="profile-page with-navbar">
        <div className="loading-container">
          <div className="modern-spinner"></div>
          <p className="loading-text">Memuat profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page with-navbar">
      <div className="profile-container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb-nav">
          <div className="breadcrumb-container">
            <Link to="/customer/dashboard" className="breadcrumb-link">
              <svg className="breadcrumb-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Dashboard
            </Link>
            <svg className="breadcrumb-separator" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polyline points="9,18 15,12 9,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span className="breadcrumb-current">Profile</span>
          </div>
        </nav>

        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-icon">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M6.5 20a6.5 6.5 0 0 1 11 0" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <h1 className="profile-title">Profile Saya</h1>
          <p className="profile-subtitle">Kelola informasi pribadi dan keamanan akun Anda</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="alert alert-success">
            <svg className="alert-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2"/>
            </svg>
            {successMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="profile-form">
          {/* Personal Information Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Informasi Pribadi</h3>
              <p>Perbarui informasi dasar profil Anda</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nama" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="nama"
                  id="nama"
                  value={form.nama}
                  onChange={onChange}
                  className="form-input"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={onChange}
                  className="form-input"
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="no_telp" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  No. Telepon
                </label>
                <input
                  type="text"
                  name="no_telp"
                  id="no_telp"
                  value={form.no_telp}
                  onChange={onChange}
                  className="form-input"
                  placeholder="08123456789"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="alamat" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Alamat
                </label>
                <textarea
                  name="alamat"
                  id="alamat"
                  value={form.alamat}
                  onChange={onChange}
                  className="form-textarea"
                  placeholder="Masukkan alamat lengkap"
                  rows="3"
                  required
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>Keamanan Akun</h3>
              <p>Ubah password untuk menjaga keamanan akun</p>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Password Baru
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={form.password}
                  onChange={onChange}
                  className="form-input"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password_confirmation" className="form-label">
                  <svg className="label-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Konfirmasi Password
                </label>
                <input
                  type="password"
                  name="password_confirmation"
                  id="password_confirmation"
                  value={form.password_confirmation}
                  onChange={onChange}
                  className="form-input"
                  placeholder="Ulangi password baru"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={saving}
            >
              {saving && (
                <svg className="btn-spinner" width="16" height="16" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.25"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.416" strokeDashoffset="31.416" fill="none">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
              )}
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;