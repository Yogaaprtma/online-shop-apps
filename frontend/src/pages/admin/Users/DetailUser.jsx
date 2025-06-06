import { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "/src/services/api.js"; // Sesuai permintaan Anda
import "/src/styles/admin/users/detail-user.css"; // Sesuai permintaan Anda

const Icon = ({ name, className, style }) => <i className={`fas fa-${name} ${className || ''}`} style={style}></i>; // Tambahkan prop style

const UserDetailAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  const fetchUserDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/users/${userId}`);
      setUser(response.data.data);
    } catch (err) {
      console.error("Gagal mengambil detail pengguna:", err);
      setError(err.response?.data?.message || "Gagal mengambil detail pengguna.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetail();
  }, [fetchUserDetail]);
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: 'numeric', month: 'long', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false // Gunakan format 24 jam jika lebih disukai
    });
  };

  const getRoleText = (role) => {
    if (!role) return "N/A";
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  if (loading) {
    return (
      <div className="admin-page-container"> {/* Pastikan kelas ini konsisten */}
        <div className="loading-fullscreen"><div className="spinner"></div><p>Memuat Detail Pengguna...</p></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container admin-user-detail-page"> {/* Gunakan kelas spesifik halaman */}
        <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol><li><Link to="/admin/dashboard">Admin</Link></li><li><Link to="/admin/users">Kelola Pengguna</Link></li><li aria-current="page">Error</li></ol>
        </nav>
        <div className="alert alert-danger full-page-alert"> {/* Kelas untuk alert besar */}
            <h4><Icon name="exclamation-triangle" /> Terjadi Kesalahan</h4>
            <p>{error}</p>
            <Link to="/admin/users" className="btn btn-primary-outline">Kembali ke Daftar</Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page-container admin-user-detail-page">
        <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol><li><Link to="/admin/dashboard">Admin</Link></li><li><Link to="/admin/users">Kelola Pengguna</Link></li><li aria-current="page">Tidak Ditemukan</li></ol>
        </nav>
        <div className="alert alert-warning full-page-alert">Pengguna tidak ditemukan.</div>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-user-detail-page"> {/* Kelas spesifik halaman */}
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/users">Kelola Pengguna</Link></li>
          <li aria-current="page">Detail: {user.nama}</li>
        </ol>
      </nav>

      <header className="admin-content-header detail-header">
        <h1><Icon name="user-tie" className="header-icon" /> Detail Pengguna</h1>
        <div className="header-actions">
          <Link to={`/admin/users/edit/${user.id}`} className="btn btn-primary">
            <Icon name="edit"/> Edit Pengguna
          </Link>
          <Link to="/admin/users" className="btn btn-outline-secondary">
            <Icon name="arrow-left"/> Kembali ke Daftar
          </Link>
        </div>
      </header>

      <div className="user-detail-content-wrapper">
        <div className="user-profile-card card animated-card">
          <div className="profile-header">
            <div className="user-avatar-large">
              {/* Jika ada URL avatar, bisa diganti img */}
              <Icon name="user-circle" />
            </div>
            <div className="profile-name-role">
              <h2>{user.nama}</h2>
              <span className={`role-tag role-${user.role}`}>
                <Icon name={user.role === 'admin' ? 'user-shield' : 'user'} /> {getRoleText(user.role)}
              </span>
            </div>
          </div>
          <div className="profile-contact-info">
            <div className="contact-item">
              <Icon name="envelope" className="contact-icon" />
              <a href={`mailto:${user.email}`}>{user.email}</a>
            </div>
            <div className="contact-item">
              <Icon name="phone-alt" className="contact-icon" />
              <span>{user.no_telp || '-'}</span>
            </div>
          </div>
        </div>

        <div className="user-additional-info card animated-card" style={{animationDelay: '0.1s'}}>
          <div className="card-header">
            <h3><Icon name="info-circle" /> Informasi Tambahan</h3>
          </div>
          <div className="card-body">
            <div className="info-grid-detail">
              <div className="info-block">
                <p className="info-block-label">ID Pengguna</p>
                <p className="info-block-value">{user.id}</p>
              </div>
              <div className="info-block">
                <p className="info-block-label">Tanggal Registrasi</p>
                <p className="info-block-value">{formatDate(user.created_at)}</p>
              </div>
              <div className="info-block">
                <p className="info-block-label">Profil Terakhir Diperbarui</p>
                <p className="info-block-value">{formatDate(user.updated_at)}</p>
              </div>
              <div className="info-block full-width-info">
                <p className="info-block-label">Alamat</p>
                <p className="info-block-value address-value">{user.alamat || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Anda bisa menambahkan bagian lain di sini, misal riwayat aktivitas pengguna, dll. */}
      {/* <div className="user-activity-section card animated-card" style={{animationDelay: '0.2s'}}>
        <div className="card-header">
            <h3><Icon name="history" /> Riwayat Aktivitas (Contoh)</h3>
        </div>
        <div className="card-body">
            <p>Belum ada data aktivitas untuk ditampilkan.</p>
        </div>
      </div> */}
    </div>
  );
};

export default UserDetailAdmin;