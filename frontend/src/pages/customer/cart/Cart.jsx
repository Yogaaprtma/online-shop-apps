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

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      alert("Keranjang belanja kosong");
      return;
    }

    try {
      // Improved payment method selection using custom modal
      const paymentMethods = [
        { id: "bank_transfer", name: "Transfer Bank" },
        { id: "cod", name: "Cash on Delivery" },
        { id: "e_wallet", name: "E-Wallet" }
      ];
      
      // Create modal for selecting payment method
      const modal = document.createElement("div");
      modal.className = "payment-modal";
      modal.innerHTML = `
        <div class="payment-modal-content">
          <h3>Pilih Metode Pembayaran</h3>
          <div class="payment-methods">
            ${paymentMethods.map(method => `
              <button class="payment-method-btn" data-method="${method.id}">
                ${method.name}
              </button>
            `).join('')}
          </div>
          <button class="payment-modal-close">Batal</button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Handle payment method selection
      return new Promise((resolve) => {
        const buttons = modal.querySelectorAll(".payment-method-btn");
        const closeBtn = modal.querySelector(".payment-modal-close");
        
        buttons.forEach(button => {
          button.addEventListener("click", async () => {
            const method = button.getAttribute("data-method");
            modal.remove();
            
            try {
              const response = await api.post("/checkout", {
                payment_method: method
              });
              
              alert("Checkout berhasil! Pesanan Anda sedang diproses.");
              navigate("/customer/orders");
            } catch (error) {
              console.error("Checkout gagal:", error);
              alert("Checkout gagal. Silakan coba lagi.");
            }
            
            resolve();
          });
        });
        
        closeBtn.addEventListener("click", () => {
          modal.remove();
          resolve();
        });
      });
      
    } catch (error) {
      console.error("Checkout gagal:", error);
      alert("Checkout gagal. Silakan coba lagi.");
    }
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
      
      {/* CSS untuk komponen keranjang */}
      <style jsx>{`
        .payment-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .payment-modal-content {
          background-color: white;
          border-radius: 12px;
          padding: 2rem;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .payment-modal h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          text-align: center;
          color: #333;
          font-size: 1.5rem;
        }
        
        .payment-methods {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .payment-method-btn {
          padding: 1rem;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .payment-method-btn:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
        }
        
        .payment-modal-close {
          width: 100%;
          padding: 0.75rem;
          background-color: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .payment-modal-close:hover {
          background-color: #f3f4f6;
        }
        
        .cart-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #10b981;
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
        }
        
        .cart-notification-error {
          background-color: #ef4444;
        }
        
        .stock-warning {
          color: #f59e0b;
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }
        
        /* Perbaikan CSS untuk container gambar produk */
        .cart-item-image {
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          position: relative;
        }
        
        /* Perbaikan CSS untuk gambar produk */
        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 8px;
          transition: none; /* Menghilangkan efek transisi */
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none; /* Mencegah interaksi hover pada gambar */
        }
        
        /* Placeholder untuk gambar */
        .item-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f3f4f6;
          border-radius: 8px;
          font-size: 1.5rem;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Cart;