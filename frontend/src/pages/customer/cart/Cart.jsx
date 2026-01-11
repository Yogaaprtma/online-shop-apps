import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/customer/cart.css";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();

  // Fungsi untuk mendapatkan URL gambar
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder-product.png"; // Gambar placeholder jika tidak ada gambar
    
    // Jika path gambar sudah berupa URL lengkap
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Gabungkan dengan URL storage publik Laravel
    return `${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'}/storage/${imagePath}`;
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await api.get("/cart");
      setCartItems(response.data.data);
      
      // Calculate total price
      const total = response.data.data.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      setTotalPrice(total);
    } catch (error) {
      console.error("Gagal mengambil data keranjang:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      
      // Update cart after removing item
      const updatedItems = cartItems.filter(item => item.id !== id);
      setCartItems(updatedItems);
      
      // Recalculate total
      const total = updatedItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      setTotalPrice(total);
      
      // Use more subtle notification instead of alert
      // Could replace with toast notification
      const notification = document.createElement("div");
      notification.className = "cart-notification";
      notification.textContent = "Item berhasil dihapus dari keranjang";
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error("Gagal menghapus item dari keranjang:", error);
      alert("Gagal menghapus item dari keranjang");
    }
  };

  const updateQuantity = async (id, newQuantity, productStock) => {
    // Validasi jumlah
    if (newQuantity < 1) {
      return;
    }
    
    if (newQuantity > productStock) {
      // Tampilkan pesan error yang lebih baik
      const notification = document.createElement("div");
      notification.className = "cart-notification cart-notification-error";
      notification.textContent = `Jumlah maksimal yang tersedia: ${productStock}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      return;
    }
    
    try {
      const itemToUpdate = cartItems.find(item => item.id === id);
      
      // Perbarui tampilan lokal terlebih dahulu untuk pengalaman yang lebih responsif
      const updatedItems = cartItems.map(item => {
        if (item.id === id) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      
      setCartItems(updatedItems);
      
      // Recalculate total
      const total = updatedItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      setTotalPrice(total);
      
      // Kirim request ke server untuk update
      await api.post("/cart", {
        product_id: itemToUpdate.product_id,
        quantity: newQuantity
      });
      
      // Tampilkan notifikasi sukses
      const notification = document.createElement("div");
      notification.className = "cart-notification";
      notification.textContent = "Jumlah produk berhasil diperbarui";
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error("Gagal mengupdate jumlah produk:", error);
      
      // Tampilkan notifikasi error
      const notification = document.createElement("div");
      notification.className = "cart-notification cart-notification-error";
      notification.textContent = "Gagal mengupdate jumlah produk";
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
      
      // Ambil ulang data keranjang untuk memastikan data terupdate
      fetchCartItems();
    }
  };


  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert("Keranjang belanja kosong");
      return;
    }
    navigate("/customer/orders/checkout");
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>Memuat keranjang...</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h2 className="cart-title">Keranjang Belanja</h2>
        <Link to="/customer/dashboard" className="back-to-shopping">
          Lanjutkan Belanja
        </Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <p>Keranjang belanja Anda kosong</p>
          <Link to="/customer/dashboard" className="continue-shopping-btn">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-image">
                  {item.product.image ? (
                    <img 
                      src={getImageUrl(item.product.image)} 
                      alt={item.product.name_product} 
                      className="product-image"
                    />
                  ) : (
                    <div className="item-image-placeholder">
                      <span>📷</span>
                    </div>
                  )}
                </div>
                <div className="cart-item-details">
                  <h4 className="item-name">{item.product.name_product}</h4>
                  <p className="item-price">
                    Rp {parseInt(item.product.price).toLocaleString('id-ID')}
                  </p>
                  {item.product.stock < 10 && (
                    <p className="stock-warning">
                      Tersisa {item.product.stock} stok
                    </p>
                  )}
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn" 
                      onClick={() => updateQuantity(item.id, item.quantity - 1, item.product.stock)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn" 
                      onClick={() => updateQuantity(item.id, item.quantity + 1, item.product.stock)}
                      disabled={item.quantity >= item.product.stock}
                    >
                      +
                    </button>
                  </div>
                  <p className="item-subtotal">
                    Rp {parseInt(item.product.price * item.quantity).toLocaleString('id-ID')}
                  </p>
                  <button 
                    className="remove-item-btn"
                    onClick={() => removeItem(item.id)}
                    title="Hapus item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-totals">
              <p className="total-label">Total Pembayaran:</p>
              <p className="total-price">Rp {parseInt(totalPrice).toLocaleString('id-ID')}</p>
            </div>
            <button className="checkout-btn" onClick={handleCheckout}>
              Lanjutkan ke Pembayaran
            </button>
          </div>
        </>
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

export default Cart;