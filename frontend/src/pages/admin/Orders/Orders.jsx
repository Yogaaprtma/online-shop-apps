import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/orders/orders.css";

// Komponen ikon sederhana
const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const AdminOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 10;

  const navigate = useNavigate();

  // Fungsi untuk memuat SweetAlert2 dari CDN (seperti contoh Anda)
  const loadSweetAlert = () => {
    return new Promise((resolve, reject) => {
      if (window.Swal) {
        resolve(window.Swal);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      script.onload = () => {
        if (window.Swal) {
          resolve(window.Swal);
        } else {
          reject(new Error("Gagal memuat SweetAlert2"));
        }
      };
      script.onerror = () => reject(new Error("Gagal memuat SweetAlert2 dari CDN"));
      document.body.appendChild(script);
    });
  };


  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/admin/orders");
        console.log("Data Pesanan dari API:", response.data.data);
        setOrders(response.data.data || []);
      } catch (err) {
        console.error("Gagal mengambil data pesanan:", err);
        setError(
          err.response?.data?.message ||
            "Terjadi kesalahan saat mengambil data pesanan."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (price) => {
    if (price === null || typeof price === "undefined") return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "pending": return "status-pending";
      case "waiting_confirmation": return "status-waiting";
      case "paid": return "status-paid";
      case "processing": return "status-processing";
      case "shipped": return "status-shipped";
      case "completed": return "status-completed";
      case "cancelled": return "status-cancelled";
      default: return "status-default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "waiting_confirmation": return "Menunggu Konfirmasi";
      case "paid": return "Dibayar";
      case "processing": return "Diproses";
      case "shipped": return "Dikirim";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default:
        return status ? status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A";
    }
  };

  // Menggunakan metode loadSweetAlert dari CDN
  const handleConfirmPayment = async (orderId) => {
    try {
      const Swal = await loadSweetAlert(); // Muat SweetAlert
      const result = await Swal.fire({
        title: "Konfirmasi Pembayaran?",
        text: "Apakah Anda yakin ingin mengonfirmasi pembayaran untuk pesanan ini?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "var(--admin-success-color, #28a745)", // Menggunakan variabel CSS jika ada
        cancelButtonColor: "var(--admin-secondary-color, #6c757d)",
        confirmButtonText: "Ya, Konfirmasi!",
        cancelButtonText: "Batal",
        customClass: { // Menambahkan custom class agar konsisten dengan contoh Anda
          title: "swal-title",
          content: "swal-content",
          confirmButton: "swal-confirm",
          cancelButton: "swal-cancel",
        }
      });

      if (result.isConfirmed) {
        setLoading(true); 
        await api.post(`/admin/orders/${orderId}/confirm`);
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'paid', payment_date: new Date().toISOString() } : order
          )
        );
        // Pesan sukses menggunakan SweetAlert
        Swal.fire({
            title: "Berhasil!", 
            text: "Pembayaran telah dikonfirmasi.", 
            icon: "success",
            timer: 1800, // Durasi tampil
            showConfirmButton: false // Tidak perlu tombol OK jika ada timer
        });
      }
    } catch (err) {
      console.error("Error pada proses konfirmasi atau SweetAlert:", err.message);
      setError("Gagal memproses konfirmasi pembayaran."); // Pesan error umum
      // Fallback jika SweetAlert gagal di tahap awal atau ada error lain
      try {
        const Swal = await loadSweetAlert(); // Coba muat lagi untuk pesan error
        Swal.fire({
          title: "Error!",
          text: err.response?.data?.message || "Gagal mengonfirmasi pembayaran.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } catch {
        // Fallback paling akhir jika SweetAlert benar-benar tidak bisa dimuat
        alert(err.response?.data?.message || "Gagal mengonfirmasi pembayaran. SweetAlert juga gagal dimuat.");
      }
    } finally {
      setLoading(false);
    }
  };


  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const searchTermLower = searchTerm.toLowerCase();
        const userName = order.user && order.user.nama ? order.user.nama.toLowerCase() : "";
        const userEmail = order.user && order.user.email ? order.user.email.toLowerCase() : "";

        const matchesSearch =
          order.id.toString().includes(searchTermLower) ||
          userName.includes(searchTermLower) ||
          userEmail.includes(searchTermLower);

        if (filterStatus === "all") {
          return matchesSearch;
        }
        return matchesSearch && order.status === filterStatus;
      })
  }, [orders, searchTerm, filterStatus]);

  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const currentOrdersToDisplay = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  );

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 3;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push("...");
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push("...");
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen">
          <div className="spinner"></div>
          <p>Memuat Data Pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-orders-page">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li aria-current="page">Pesanan</li>
        </ol>
      </nav>

      <header className="admin-content-header">
        <h1>Daftar Pesanan</h1>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="controls-container card">
        <div className="search-input-admin">
          <Icon name="search" className="search-icon-admin" />
          <input
            type="text"
            placeholder="Cari ID Pesanan, Nama/Email Pelanggan..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
          />
        </div>
        <div className="filter-status-admin">
          <label htmlFor="statusFilter">Filter Status:</label>
          <select
            id="statusFilter"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1);}}
            className="form-select-admin"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="waiting_confirmation">Menunggu Konfirmasi</option>
            <option value="paid">Dibayar</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      <div className="table-container card">
        {loading && orders.length > 0 && <div className="table-loading-overlay"><div className="spinner-small"></div>Memuat...</div>}
        <table className="admin-table orders-table">
          <thead>
            <tr>
              <th>ID Pesanan</th>
              <th>Pelanggan</th>
              <th>Tanggal</th>
              <th>Total</th>
              <th>Metode Bayar</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {currentOrdersToDisplay.length > 0 ? (
              currentOrdersToDisplay.map((order) => (
                <tr key={order.id}>
                  <td data-label="ID Pesanan">#{order.id}</td>
                  <td data-label="Pelanggan">
                    {order.user?.nama || "N/A"} 
                    <br/> 
                    <small>{order.user?.email || "Email tidak tersedia"}</small>
                  </td>
                  <td data-label="Tanggal">{formatDate(order.created_at)}</td>
                  <td data-label="Total">{formatPrice(order.total)}</td>
                  <td data-label="Metode Bayar">{getStatusText(order.payment_method)}</td>
                  <td data-label="Status">
                    <span className={`status-pill ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td data-label="Aksi" className="actions-cell">
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="btn-action btn-view"
                      title="Lihat Detail"
                    >
                      <Icon name="eye" /> <span className="btn-action-text">Lihat</span>
                    </button>
                    {order.status === "waiting_confirmation" && order.payment_proof && (
                      <button
                        onClick={() => handleConfirmPayment(order.id)}
                        className="btn-action btn-confirm"
                        title="Konfirmasi Pembayaran"
                      >
                        <Icon name="check-circle" /> <span className="btn-action-text">Konfirmasi</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-cell">
                  {loading ? "Memuat pesanan..." : "Tidak ada pesanan yang cocok dengan filter atau pencarian Anda."}
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

export default AdminOrderList;
