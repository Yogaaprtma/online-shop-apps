import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/customer/order.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get("/orders");
        setOrders(response.data.data);
      } catch (error) {
        console.error("Gagal mengambil data pesanan:", error);
        alert("Gagal mengambil data pesanan");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'your-client-key');
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const refetchOrders = async () => {
    const response = await api.get("/orders");
    setOrders(response.data.data);
    if (selectedOrder) {
      // refresh detail jika sedang terbuka
      const res = await api.get(`/orders/${selectedOrder.id}`);
      setSelectedOrder(res.data.data);
    }
  };

  const getOrderDetail = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data.data);
    } catch (error) {
      console.error("Gagal mengambil detail pesanan:", error);
      alert("Gagal mengambil detail pesanan");
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setPaymentFile(null);
    setFileName("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentFile(file);
      setFileName(file.name);
    }
  };

  const uploadPaymentProof = async (orderId) => {
    if (!paymentFile) {
      alert("Pilih file bukti pembayaran terlebih dahulu");
      return;
    }
    const formData = new FormData();
    formData.append("payment_proof", paymentFile);
    try {
      setUploadLoading(true);
      await api.post(`/orders/${orderId}/pay`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "waiting_confirmation", payment_proof: true } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: "waiting_confirmation", payment_proof: true }));
      }
      alert("Bukti pembayaran berhasil diunggah");
      setPaymentFile(null);
      setFileName("");
    } catch (error) {
      console.error("Gagal mengunggah bukti pembayaran:", error);
      alert("Gagal mengunggah bukti pembayaran");
    } finally {
      setUploadLoading(false);
    }
  };

  // --- Label metode: gunakan payment_method jika ada; jika null, fallback ke payment_type ---
  const getPaymentLabel = (payment_method, payment_type) => {
    if (payment_method) {
      switch (payment_method) {
        case "bank_transfer": return "Transfer Bank";
        case "cod": return "Cash on Delivery";
        case "e_wallet": return "E-Wallet";
        default: return payment_method;
      }
    }
    if (payment_type) {
      switch (payment_type) {
        case "credit_card": return "Kartu Kredit";
        case "bank_transfer":
        case "echannel":
        case "permata":
        case "bca_va":
        case "bni_va":
        case "bri_va":
          return "Transfer Bank";
        case "gopay": return "GoPay";
        case "shopeepay": return "ShopeePay";
        case "qris": return "QRIS";
        default: return payment_type.replace(/_/g, " ").toUpperCase();
      }
    }
    return "—";
  };

  const initiateMidtransPayment = (snapToken, orderCode) => {
    if (!window.snap) {
      alert("Midtrans Snap.js belum dimuat. Silakan coba lagi.");
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: async () => {
        try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
        await refetchOrders();
        alert("Pembayaran berhasil!");
      },
      onPending: async () => {
        try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
        await refetchOrders();
        alert("Pembayaran sedang diproses. Silakan selesaikan pembayaran.");
      },
      onError: () => {
        alert("Pembayaran gagal. Silakan coba lagi.");
      },
      onClose: async () => {
        try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
        await refetchOrders();
      }
    });
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Menunggu Pembayaran";
      case "waiting_confirmation": return "Menunggu Konfirmasi";
      case "paid": return "Dibayar";
      case "processing": return "Diproses";
      case "shipped": return "Dikirim";
      case "completed": return "Selesai";
      case "cancelled": return "Dibatalkan";
      case "failed": return "Gagal";
      default: return status;
    }
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
      case "failed": return "status-failed";
      default: return "";
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Memuat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div className="orders-title-section">
          <h2>Pesanan Saya</h2>
          <p className="orders-subtitle">Kelola dan pantau semua pesanan Anda</p>
        </div>
        <Link to="/customer/dashboard" className="back-button">
          <i className="fas fa-arrow-left"></i> Kembali ke Dashboard
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-shopping-bag"></i></div>
          <h3>Belum Ada Pesanan</h3>
          <p>Anda belum melakukan pemesanan apapun</p>
          <Link to="/customer/dashboard" className="shop-now-button">Mulai Belanja</Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div className="order-card" key={order.id}>
              <div className="order-card-header">
                <div className="order-meta">
                  <span className="order-number">Order #{order.id}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className={`order-status ${getStatusClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </div>
              </div>

              <div className="order-card-body">
                <div className="order-info-row">
                  <div className="info-item">
                    <span className="info-label">Total Pembayaran</span>
                    <span className="info-value">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Metode Pembayaran</span>
                    <span className="info-value">
                      {getPaymentLabel(order.payment_method, order.payment_type)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="order-card-footer">
                <button className="detail-button" onClick={() => getOrderDetail(order.id)}>
                  <i className="fas fa-eye"></i> Lihat Detail
                </button>

                {order.status === "pending" && order.snap_token && (
                  <button
                    className="payment-button"
                    onClick={() => {
                      getOrderDetail(order.id);
                      setTimeout(() => initiateMidtransPayment(order.snap_token, order.order_code), 0);
                    }}
                  >
                    <i className="fas fa-credit-card"></i> Bayar Sekarang
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderDetail}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detail Pesanan #{selectedOrder.id}</h3>
              <button className="close-button" onClick={closeOrderDetail}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="order-detail-section">
                <div className="detail-header">Informasi Pesanan</div>
                <div className="detail-row">
                  <span className="detail-label">Tanggal Pemesanan</span>
                  <span className="detail-value">
                    {new Date(selectedOrder.created_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`detail-value status-badge ${getStatusClass(selectedOrder.status)}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Metode Pembayaran</span>
                  <span className="detail-value">
                    {getPaymentLabel(selectedOrder.payment_method, selectedOrder.payment_type)}
                  </span>
                </div>
                {selectedOrder.payment_date && (
                  <div className="detail-row">
                    <span className="detail-label">Tanggal Pembayaran</span>
                    <span className="detail-value">
                      {new Date(selectedOrder.payment_date).toLocaleDateString("id-ID", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="order-items-section">
                <div className="detail-header">Item Pesanan</div>
                <div className="order-items-list">
                  <div className="item-header">
                    <span className="item-name-header">Produk</span>
                    <span className="item-quantity-header">Jumlah</span>
                    <span className="item-price-header">Harga</span>
                    <span className="item-subtotal-header">Subtotal</span>
                  </div>

                  {selectedOrder.items?.map((item) => (
                    <div className="item-row" key={item.id}>
                      <span className="item-name">{item.product?.name_product || "Produk Telah Dihapus"}</span>
                      <span className="item-quantity">{item.quantity}</span>
                      <span className="item-price">{formatCurrency(item.price)}</span>
                      <span className="item-subtotal">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}

                  <div className="order-total-row">
                    <span className="total-label">Total Pesanan</span>
                    <span className="total-value">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.status === "pending" && selectedOrder.snap_token && (
                <div className="payment-section">
                  <div className="detail-header">Pembayaran</div>
                  <div className="midtrans-payment">
                    <p>Silakan selesaikan pembayaran melalui Midtrans.</p>
                    <button
                      className="midtrans-button"
                      onClick={() => initiateMidtransPayment(selectedOrder.snap_token, selectedOrder.order_code)}
                    >
                      <i className="fas fa-credit-card"></i> Bayar dengan Midtrans
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bottom-nav">
        <div className="bottom-nav-container">
          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/customer/dashboard')}
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
            onClick={() => navigate('/customer/products')}
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
            onClick={() => navigate('/customer/cart')}
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
            className={`bottom-nav-item ${window.location.pathname === '/customer/orders' || window.location.pathname.includes('/customer/orders') ? 'active' : ''}`}
            onClick={() => navigate('/customer/orders')}
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
            onClick={() => navigate('/customer/profile')}
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

export default Orders;