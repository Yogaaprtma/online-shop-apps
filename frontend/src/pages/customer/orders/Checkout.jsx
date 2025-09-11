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
                  <img src={getImageUrl(item.product.image)} alt={item.product.name_product} className="product-image" />
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
    </div>
  );
};

export default Checkout;