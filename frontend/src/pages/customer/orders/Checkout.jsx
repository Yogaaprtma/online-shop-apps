import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/customer/checkout.css";

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder-product.png";
    if (imagePath.startsWith("http")) return imagePath;
    return `${import.meta.env.VITE_APP_URL || "http://127.0.0.1:8000"}/storage/${imagePath}`;
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const response = await api.get("/cart");
        setCartItems(response.data.data);
        const total = response.data.data.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        setTotalPrice(total);
      } catch {
        setError("Gagal memuat data keranjang.");
      } finally {
        setLoading(false);
      }
    };
    fetchCartItems();
  }, []);

  // ---- Midtrans Snap loader (gunakan window.snap) ----
  const waitForSnapReady = () =>
    new Promise((resolve, reject) => {
      let waited = 0;
      const step = 50;
      const max = 7000;
      const tick = () => {
        if (window.snap && typeof window.snap.pay === "function") return resolve(window.snap);
        waited += step;
        if (waited >= max) return reject(new Error("Midtrans Snap belum siap"));
        setTimeout(tick, step);
      };
      tick();
    });

  const ensureSnapLoaded = async () => {
    if (window.snap && typeof window.snap.pay === "function") return window.snap;
    const existing = document.querySelector('script[src*="snap/snap.js"]');
    if (!existing) {
      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("VITE_MIDTRANS_CLIENT_KEY kosong. Set di .env.local lalu restart Vite.");
      }
      const s = document.createElement("script");
      s.src = "https://app.sandbox.midtrans.com/snap/snap.js";
      s.setAttribute("data-client-key", clientKey);
      s.async = true;
      document.body.appendChild(s);
    }
    return await waitForSnapReady();
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

  const handleCheckout = async () => {
    if (processing) return;
    if (cartItems.length === 0) {
      setError("Keranjang belanja kosong.");
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const ck = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
      if (!ck) throw new Error("VITE_MIDTRANS_CLIENT_KEY tidak terbaca di FE.");

      const snap = await ensureSnapLoaded();

      // 1) Minta snap_token + order_code dari backend
      const res = await api.post("/checkout");
      const snapToken = res.data?.snap_token;
      const orderCode = res.data?.order_code;
      if (!snapToken || !orderCode) throw new Error("snap_token / order_code kosong dari server.");

      // 2) Tampilkan modal Snap
      snap.pay(snapToken, {
        onSuccess: async () => {
          try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
          alert("Pembayaran berhasil!");
          navigate("/customer/orders");
        },
        onPending: async () => {
          try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
          alert("Pembayaran sedang diproses / menunggu.");
          navigate("/customer/orders");
        },
        onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
        onClose: async () => {
          // user menutup tanpa bayar — coba sinkron sekali (opsional)
          try { await api.post("/midtrans/verify", { order_code: orderCode }); } catch {}
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Checkout gagal. Silakan coba lagi.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Memuat data checkout...</p>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h2 className="checkout-title">Checkout</h2>
        <Link to="/customer/cart" className="back-to-cart">Kembali ke Keranjang</Link>
      </div>

      {error && <div className="error-alert">{error}</div>}

      <div className="checkout-grid">
        <section className="order-summary">
          <h3 className="section-title">Ringkasan Pesanan</h3>
          <div className="items-list">
            {cartItems.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div className="item-image">
                  <img src={getImageUrl(item.product.image)} alt={item.product.name_product} className="checkout-product-img" />
                </div>
                <div className="item-details">
                  <h4 className="item-name">{item.product.name_product}</h4>
                  <p className="item-quantity">Jumlah: {item.quantity}</p>
                  <p className="item-price">{formatCurrency(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="total-section">
            <span className="total-label">Total Pembayaran:</span>
            <span className="total-price">{formatCurrency(totalPrice)}</span>
          </div>
        </section>

        <section className="payment-method">
          <h3 className="section-title">Pembayaran</h3>
          <p>Tekan tombol di bawah untuk membuka modal Midtrans Snap dan pilih metode pembayaran.</p>
          <button className="confirm-checkout-btn" onClick={handleCheckout}>
            Bayar dengan Midtrans
          </button>
        </section>
      </div>

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
            className={`bottom-nav-item ${window.location.pathname === '/customer/orders' ? 'active' : ''}`}
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

export default Checkout;