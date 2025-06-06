// src/pages/admin/users/UserList.jsx
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/users/users-list.css";

const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  const navigate = useNavigate();

  const loadSweetAlert = () => {
    return new Promise((resolve, reject) => {
      if (window.Swal) return resolve(window.Swal);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      script.onload = () => window.Swal ? resolve(window.Swal) : reject(new Error("Gagal memuat SweetAlert2"));
      script.onerror = () => reject(new Error("Gagal memuat SweetAlert2 dari CDN"));
      document.body.appendChild(script);
    });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/admin/users");
      setUsers(response.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data pengguna:", err);
      setError(err.response?.data?.message || "Terjadi kesalahan saat mengambil data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getRoleClass = (role) => {
    if (role === 'admin') return 'role-admin';
    if (role === 'user') return 'role-user';
    return 'role-default';
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const searchTermLower = searchTerm.toLowerCase();
        const matchesSearch =
          user.nama.toLowerCase().includes(searchTermLower) ||
          user.email.toLowerCase().includes(searchTermLower) ||
          (user.no_telp && user.no_telp.includes(searchTermLower));

        if (filterRole === "all") return matchesSearch;
        return matchesSearch && user.role === filterRole;
      })
      .sort((a,b) => a.nama.localeCompare(b.nama)); 
  }, [users, searchTerm, filterRole]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const currentUsersToDisplay = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };
  const goToPage = (pageNumber) => { setCurrentPage(pageNumber); };

  const getPageNumbers = () => {
    const pageNumbers = []; const maxPagesToShow = 3; let startPage, endPage;
    if (totalPages <= maxPagesToShow) { startPage = 1; endPage = totalPages; }
    else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) { startPage = 1; endPage = maxPagesToShow; }
      else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) { startPage = totalPages - maxPagesToShow + 1; endPage = totalPages; }
      else { startPage = currentPage - Math.floor(maxPagesToShow / 2); endPage = currentPage + Math.floor(maxPagesToShow / 2); }
    }
    if (startPage > 1) { pageNumbers.push(1); if (startPage > 2) pageNumbers.push("..."); }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    if (endPage < totalPages) { if (endPage < totalPages - 1) pageNumbers.push("..."); pageNumbers.push(totalPages); }
    return pageNumbers;
  };

  const handleDeleteUser = (userId, userName) => {
     loadSweetAlert().then(Swal => {
        Swal.fire({
            title: 'Hapus Pengguna?',
            text: `Anda yakin ingin menghapus pengguna "${userName}"? Aksi ini tidak dapat diurungkan.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            confirmButtonColor: 'var(--admin-danger-color, #e74c3c)',
            cancelButtonColor: 'var(--admin-secondary-color, #6c757d)',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    setLoading(true); // Menandakan proses sedang berjalan
                    await api.delete(`/admin/users/${userId}`);
                    Swal.fire('Terhapus!', `Pengguna "${userName}" telah dihapus.`, 'success');
                    fetchUsers(); // Ambil ulang data pengguna setelah berhasil hapus
                } catch (errDel) {
                    console.error("Gagal menghapus pengguna:", errDel);
                    Swal.fire('Gagal!', errDel.response?.data?.message || 'Gagal menghapus pengguna.', 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
    }).catch(err => {
        console.error("Gagal memuat SweetAlert:", err);
        // Fallback alert biasa jika SweetAlert gagal load
        if(confirm(`Anda yakin ingin menghapus pengguna "${userName}"? (SweetAlert gagal dimuat)`)) {
            // Implementasi API call delete di sini jika perlu fallback tanpa SweetAlert
            api.delete(`/admin/users/${userId}`)
                .then(() => {
                    alert(`Pengguna "${userName}" telah dihapus.`);
                    fetchUsers();
                })
                .catch(errDel => {
                    alert(errDel.response?.data?.message || 'Gagal menghapus pengguna.');
                });
        }
    });
  };


  if (loading && users.length === 0) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen"><div className="spinner"></div><p>Memuat Data Pengguna...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-user-list-page">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li aria-current="page">Kelola Pengguna</li>
        </ol>
      </nav>

      <header className="admin-content-header">
        <h1>Daftar Pengguna ({filteredUsers.length})</h1>
        <Link to="/admin/users/add" className="btn btn-primary">
          <Icon name="user-plus" /> Tambah Pengguna Baru
        </Link>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="controls-container card">
        <div className="search-input-admin">
          <Icon name="search" className="search-icon-admin" />
          <input
            type="text"
            placeholder="Cari Nama, Email, atau No. Telp..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
        </div>
        <div className="filter-role-admin">
          <label htmlFor="roleFilter">Filter Peran:</label>
          <select
            id="roleFilter"
            value={filterRole}
            onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1);}}
            className="form-select-admin"
          >
            <option value="all">Semua Peran</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      <div className="table-container card">
        {loading && users.length > 0 && <div className="table-loading-overlay"><div className="spinner-small"></div>Memuat...</div>}
        <table className="admin-table user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama</th>
              <th>Email</th>
              <th>No. Telepon</th>
              {/* <th>Alamat</th> (Opsional, bisa terlalu panjang untuk tabel list) */}
              <th>Peran</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentUsersToDisplay.length > 0 ? (
              currentUsersToDisplay.map((user, index) => (
                <tr key={user.id} style={{"--animation-order": index}} className="table-row-animated">
                  <td data-label="ID">{user.id}</td>
                  <td data-label="Nama">{user.nama}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="No. Telepon">{user.no_telp || '-'}</td>
                  {/* <td data-label="Alamat" className="address-cell">{user.alamat || '-'}</td> */}
                  <td data-label="Peran">
                    <span className={`role-badge ${getRoleClass(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td data-label="Terdaftar">{formatDate(user.created_at)}</td>
                  <td data-label="Aksi" className="actions-cell">
                    <button 
                        onClick={() => navigate(`/admin/users/detail/${user.id}`)} 
                        className="btn-action btn-view" title="Lihat Detail">
                        <Icon name="eye" /> <span className="btn-action-text-hidden-sm">Detail</span>
                    </button>
                    <button 
                        onClick={() => navigate(`/admin/users/edit/${user.id}`)} 
                        className="btn-action btn-edit" title="Edit Pengguna">
                        <Icon name="edit" /> <span className="btn-action-text-hidden-sm">Edit</span>
                    </button>
                    <button 
                        onClick={() => handleDeleteUser(user.id, user.nama)} 
                        className="btn-action btn-delete" title="Hapus Pengguna">
                        <Icon name="trash-alt" /> <span className="btn-action-text-hidden-sm">Hapus</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-cell"> {/* Sesuaikan colSpan jika kolom berubah */}
                  {loading ? "Memuat pengguna..." : "Tidak ada pengguna yang cocok."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="pagination-controls">
           <button onClick={prevPage} disabled={currentPage === 1} className="btn btn-pagination">
            <Icon name="chevron-left" /> Sebelumnya
          </button>
          <div className="page-numbers">
            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <span key={`ellipsis-${index}`} className="ellipsis">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`btn btn-page-number ${currentPage === page ? "active" : ""}`}
                  disabled={currentPage === page}
                >
                  {page}
                </button>
              )
            )}
          </div>
          <button onClick={nextPage} disabled={currentPage === totalPages} className="btn btn-pagination">
            Selanjutnya <Icon name="chevron-right" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UserList;