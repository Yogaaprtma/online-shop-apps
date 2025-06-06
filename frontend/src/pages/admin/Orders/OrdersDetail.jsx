import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/orders/orders-detail.css";

const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const AdminOrderDetail = () => {
  const { orderId } = useParams(); 
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const navigate = useNavigate();

  // Fungsi untuk memuat SweetAlert2 dari CDN
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

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/orders/${orderId}`);
      setOrder(response.data.data);
    } catch (err) {
      console.error("Gagal mengambil detail pesanan:", err);
      setError(err.response?.data?.message || "Gagal mengambil detail pesanan.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const formatPrice = (price) => {
    if (price === null || typeof price === "undefined") return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return "N/A";
    const options = {
      day: "2-digit",
      month: "long",
      year: "numeric",
    };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const getStatusClass = (status) => {
    // (Sama seperti di AdminOrderList.jsx)
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
    // (Sama seperti di AdminOrderList.jsx)
    switch (status) {
      case "pending": return "Pending";
      case "waiting_confirmation": return "Menunggu Konfirmasi";
      case "paid": return "Dibayar";
      case "processing": return "Diproses";
      case "shipped": return "Dikirim";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status ? status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A";
    }
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case "bank_transfer": return "Transfer Bank";
      case "cod": return "Cash on Delivery (COD)";
      case "e_wallet": return "E-Wallet";
      default: return method ? method.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : "N/A";
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    
    try {
        const Swal = await loadSweetAlert();
        const result = await Swal.fire({
            title: "Konfirmasi Pembayaran?",
            text: `Anda akan mengonfirmasi pembayaran untuk Pesanan #${order.id}.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Ya, Konfirmasi!",
            cancelButtonText: "Batal",
            confirmButtonColor: "var(--admin-success-color, #28a745)",
            cancelButtonColor: "var(--admin-secondary-color, #6c757d)",
            customClass: {
              title: "swal-title",
              content: "swal-content",
              confirmButton: "swal-confirm",
              cancelButton: "swal-cancel",
            }
        });

        if (result.isConfirmed) {
            setIsConfirming(true);
            await api.post(`/admin/orders/${order.id}/confirm`);
            setOrder(prevOrder => ({
                ...prevOrder,
                status: 'paid',
                payment_date: new Date().toISOString()
            }));
            Swal.fire({
                title: "Berhasil!", 
                text: "Pembayaran telah dikonfirmasi.", 
                icon: "success",
                timer: 1800,
                showConfirmButton: false
            });
        }
    } catch (err) {
        console.error("Error pada proses konfirmasi atau SweetAlert:", err.message);
        setError("Gagal memproses konfirmasi pembayaran.");
        try {
            const Swal = await loadSweetAlert();
            Swal.fire({
              title: "Error!",
              text: err.response?.data?.message || "Gagal mengonfirmasi pembayaran.",
              icon: "error",
              confirmButtonText: "OK",
            });
        } catch {
            alert(err.response?.data?.message || "Gagal mengonfirmasi pembayaran. SweetAlert juga gagal dimuat.");
        }
    } finally {
        setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen">
          <div className="spinner"></div>
          <p>Memuat Detail Pesanan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container admin-orders-page"> {/* Menggunakan admin-orders-page untuk konsistensi alert */}
        <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol>
            <li><Link to="/admin/dashboard">Admin</Link></li>
            <li><Link to="/admin/orders">Pesanan</Link></li>
            <li aria-current="page">Error</li>
          </ol>
        </nav>
        <div className="alert alert-danger full-page-alert">
            <h4><Icon name="exclamation-triangle" /> Terjadi Kesalahan</h4>
            <p>{error}</p>
            <Link to="/admin/orders" className="btn btn-primary-outline">Kembali ke Daftar Pesanan</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page-container admin-orders-page">
         <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol>
            <li><Link to="/admin/dashboard">Admin</Link></li>
            <li><Link to="/admin/orders">Pesanan</Link></li>
            <li aria-current="page">Tidak Ditemukan</li>
          </ol>
        </nav>
        <div className="alert alert-warning full-page-alert">Pesanan tidak ditemukan.</div>
      </div>
    );
  }

  const paymentProofUrl = order.payment_proof 
    ? `${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'}/storage/${order.payment_proof}`
    : null;

  return (
    <div className="admin-page-container admin-order-detail-page">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/orders">Pesanan</Link></li>
          <li aria-current="page">Detail Pesanan #{order.id}</li>
        </ol>
      </nav>

      <header className="admin-content-header detail-header">
        <h1>Detail Pesanan #{order.id}</h1>
        <div className="header-actions">
            <Link to="/admin/orders" className="btn btn-outline-secondary">
                <Icon name="arrow-left" /> Kembali ke Daftar
            </Link>
            {order.status === "waiting_confirmation" && order.payment_proof && (
                <button 
                    onClick={handleConfirmPayment} 
                    className="btn btn-success" // Menggunakan kelas standar tombol bootstrap-like
                    disabled={isConfirming}
                >
                    {isConfirming ? <><span className="spinner-btn-small"></span> Memproses...</> : <><Icon name="check-circle" /> Konfirmasi Pembayaran</>}
                </button>
            )}
        </div>
      </header>

      <div className="order-detail-grid">
        <section className="order-info-main card">
          <div className="card-header"><h3>Informasi Pesanan</h3></div>
          <div className="card-body">
            <ul className="info-list-detail">
              <li><strong>ID Pesanan:</strong> <span>#{order.id}</span></li>
              <li><strong>Tanggal Pesanan:</strong> <span>{formatDate(order.created_at)}</span></li>
              <li><strong>Status Pesanan:</strong> <span className={`status-text ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</span></li>
              <li><strong>Total Pembayaran:</strong> <span className="total-amount">{formatPrice(order.total)}</span></li>
              <li><strong>Metode Pembayaran:</strong> <span>{getPaymentMethodText(order.payment_method)}</span></li>
              {order.payment_date && <li><strong>Tanggal Pembayaran:</strong> <span>{formatDate(order.payment_date)}</span></li>}
            </ul>
          </div>
        </section>

        <section className="customer-info card">
          <div className="card-header"><h3>Informasi Pelanggan</h3></div>
          <div className="card-body">
            {order.user ? (
              <ul className="info-list-detail">
                <li><strong>Nama:</strong> <span>{order.user.nama || "N/A"}</span></li>
                <li><strong>Email:</strong> <span>{order.user.email || "N/A"}</span></li>
              </ul>
            ) : (
              <p>Data pelanggan tidak tersedia.</p>
            )}
          </div>
        </section>
        
        {paymentProofUrl && (
          <section className="payment-proof-section card">
            <div className="card-header"><h3>Bukti Pembayaran</h3></div>
            <div className="card-body payment-proof-body">
              <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer" title="Lihat bukti pembayaran">
                <img src={paymentProofUrl} alt={`Bukti Bayar Pesanan #${order.id}`} className="payment-proof-image"/>
              </a>
              <a href={paymentProofUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link-download">
                <Icon name="download"/> Lihat/Unduh Bukti
              </a>
            </div>
          </section>
        )}
      </div>

      <section className="order-items-section card">
        <div className="card-header"><h3>Item Pesanan ({order.items?.length || 0} item)</h3></div>
        <div className="card-body table-responsive-items">
          {order.items && order.items.length > 0 ? (
            <table className="items-table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-center">Jumlah</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="product-item-info">
                        <span className="item-product-name">{item.product?.name_product || "Produk Telah Dihapus"}</span>
                      </div>
                    </td>
                    <td className="text-right">{formatPrice(item.price)}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{formatPrice(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Tidak ada item dalam pesanan ini.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminOrderDetail;