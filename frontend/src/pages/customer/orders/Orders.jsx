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
    </div>
  );
};

export default Orders;