import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/customer/dashboard-customer.css";

const DashboardCustomer = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fungsi untuk memuat SweetAlert2 dari CDN
    const loadSweetAlert = () => {
      return new Promise((resolve, reject) => {
        // Cek apakah SweetAlert2 sudah dimuat
        if (window.Swal) {
          console.log("SweetAlert2 sudah dimuat");
          resolve(window.Swal);
          return;
        }

        // Buat elemen script untuk memuat SweetAlert2 dari CDN
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
        script.async = true;

        // Ketika script selesai dimuat
        script.onload = () => {
          if (window.Swal) {
            console.log("SweetAlert2 berhasil dimuat melalui CDN");
            resolve(window.Swal);
          } else {
            console.error("Gagal memuat SweetAlert2: window.Swal tidak tersedia");
            reject(new Error("Gagal memuat SweetAlert2"));
          }
        };

        // Jika terjadi error saat memuat script
        script.onerror = () => {
          console.error("Gagal memuat SweetAlert2 dari CDN");
          reject(new Error("Gagal memuat SweetAlert2 dari CDN"));
        };

        // Tambahkan script ke dokumen
        document.body.appendChild(script);
      });
    };

    const fetchUser = async () => {
      try {
        console.log("Mengambil data pengguna...");
        const response = await api.get("/profile");
        console.log("Data pengguna berhasil diambil:", response.data.data);
        
        // Verifikasi bahwa pengguna adalah customer
        if (response.data.data.role === "admin") {
          navigate("/admin/dashboard"); // Redirect ke dashboard admin jika user adalah admin
          return;
        }
        
        setUser(response.data.data);
        setLoading(false);

        // Cek apakah popup sudah pernah ditampilkan
        const hasShownPopup = localStorage.getItem("hasShownLoginPopup");
        console.log("Status hasShownPopup:", hasShownPopup);

        if (!hasShownPopup && response.data.data) {
          console.log("Menampilkan popup SweetAlert...");
          loadSweetAlert()
            .then((Swal) => {
              Swal.fire({
                icon: "success",
                title: "Selamat!",
                text: `Anda Berhasil Login, ${response.data.data.nama || "User"}`,
                confirmButtonText: "OK",
                confirmButtonColor: "#6366f1",
              });
              console.log("Popup SweetAlert berhasil ditampilkan");
            })
            .catch((error) => {
              console.error("Gagal memuat SweetAlert2:", error.message);
              // Fallback ke alert biasa jika SweetAlert gagal dimuat
              alert(`Anda Berhasil Login, ${response.data.data.nama || "User"}`);
            });

          // Tandai bahwa popup sudah ditampilkan
          localStorage.setItem("hasShownLoginPopup", "true");
          console.log("Status hasShownPopup diset ke true");
        } else {
          console.log("Popup tidak ditampilkan karena sudah pernah muncul atau data pengguna tidak ada");
        }
      } catch (error) {
        console.error("Gagal mengambil data pengguna:", error);
        navigate("/login");
      }
    };

    const fetchProducts = async () => {
      try {
        console.log("Mengambil data produk untuk dashboard...");
        const response = await api.get("/products?per_page=8");
        console.log("Response lengkap:", response.data); 

        // Handle paginated response - extract the actual products array
        const productsData = response.data.data?.data || response.data.data || [];
        console.log("Data produk yang diekstrak:", productsData); // Debug log
        console.log("Apakah array?", Array.isArray(productsData)); // Debug log

        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        console.error("Gagal mengambil data produk:", error);
        setProducts([]);
      }
    };

    fetchUser();
    fetchProducts();
  }, [navigate]);

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

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

  const addToCart = (e, product) => {
    e.stopPropagation(); // Mencegah event klik card saat tombol cart diklik
    
    // Buat modal untuk menambahkan produk ke keranjang
    const modal = document.createElement("div");
    modal.className = "add-to-cart-modal";
    modal.innerHTML = `
      <div class="add-to-cart-modal-content">
        <div class="modal-header">
          <h3>Tambah ke Keranjang</h3>
          <button class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="product-info-modal">
            <div class="product-image-modal">
              <img src="${getImageUrl(product.image)}" alt="${product.name_product}" 
                onerror="this.onerror=null; this.src='/placeholder-product.png';" />
            </div>
            <div class="product-details-modal">
              <h4>${product.name_product}</h4>
              <p class="product-price-modal">${formatPrice(product.price)}</p>
              <p class="product-stock">Stok: ${product.stock}</p>
            </div>
          </div>
          <div class="quantity-selector">
            <label for="quantity">Jumlah:</label>
            <div class="quantity-control-modal">
              <button class="quantity-btn-modal quantity-decrease">-</button>
              <input type="number" id="quantity" min="1" max="${product.stock}" value="1" class="quantity-input">
              <button class="quantity-btn-modal quantity-increase">+</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-cancel-btn">Batal</button>
          <button class="add-to-cart-confirm-btn">Tambah ke Keranjang</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Ambil elemen-elemen yang dibutuhkan
    const closeBtn = modal.querySelector(".modal-close-btn");
    const cancelBtn = modal.querySelector(".modal-cancel-btn");
    const confirmBtn = modal.querySelector(".add-to-cart-confirm-btn");
    const quantityInput = modal.querySelector(".quantity-input");
    const decreaseBtn = modal.querySelector(".quantity-decrease");
    const increaseBtn = modal.querySelector(".quantity-increase");
    
    // Tambahkan event listener untuk tombol tutup modal
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
    
    // Tambahkan event listener untuk tombol batal
    cancelBtn.addEventListener("click", () => {
      modal.remove();
    });
    
    // Tambahkan event listener untuk tombol kurang jumlah
    decreaseBtn.addEventListener("click", () => {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    // Tambahkan event listener untuk tombol tambah jumlah
    increaseBtn.addEventListener("click", () => {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue < product.stock) {
        quantityInput.value = currentValue + 1;
      }
    });
    
    // Tambahkan event listener untuk validasi input langsung pada input jumlah
    quantityInput.addEventListener("change", () => {
      let value = parseInt(quantityInput.value);
      if (isNaN(value) || value < 1) {
        quantityInput.value = 1;
      } else if (value > product.stock) {
        quantityInput.value = product.stock;
      }
    });
    
    // Tambahkan event listener untuk tombol konfirmasi
    confirmBtn.addEventListener("click", async () => {
      try {
        const quantity = parseInt(quantityInput.value);
        
        // Lakukan request ke API untuk menambahkan produk ke keranjang
        await api.post("/cart", {
          product_id: product.id,
          quantity: quantity
        });
        
        // Tutup modal
        modal.remove();
        
        // Tampilkan notifikasi berhasil
        loadSweetAlert()
          .then((Swal) => {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: `${product.name_product} telah ditambahkan ke keranjang`,
              // confirmButtonText: "OK",
              confirmButtonColor: "#6366f1",
              showCancelButton: true,
              cancelButtonText: "Lanjut Belanja",
              confirmButtonText: "Lihat Keranjang"
            }).then((result) => {
              if (result.isConfirmed) {
                // Arahkan ke halaman keranjang jika user klik lihat keranjang
                navigate("/customer/cart");
              }
            });
          })
          .catch((error) => {
            console.error("Gagal memuat SweetAlert2:", error.message);
            if (confirm(`${product.name_product} telah ditambahkan ke keranjang. Lihat keranjang?`)) {
              navigate("/customer/cart");
            }
          });
      } catch (error) {
        console.error("Gagal menambahkan produk ke keranjang:", error);
        alert("Gagal menambahkan produk ke keranjang. Silakan coba lagi.");
        modal.remove();
      }
    });
  };

  const navigateToProductDetail = (product) => {
    navigate(`/customer/product/detail/${product.id}`, { state: { product } });
  };

  const getDiscountPercentage = (product) => {
    // Fungsi untuk mendapatkan persentase diskon random per produk
    // Nilai ini bisa diganti dengan logika nyata dari backend
    const productId = product.id || 0;
    const discounts = [20, 23, 25, 31, 40];
    return discounts[productId % discounts.length];
  };

  // Fungsi untuk navigasi ke halaman tertentu
  const navigateTo = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Hero Section dengan Welcome Message */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>Halo, {user?.nama || "User"}!</h1>
          <p>Selamat datang di marketplace kami. Temukan produk terbaik dengan harga terjangkau.</p>
        </div>
        <div className="dashboard-action-buttons">
          <button onClick={() => navigateTo('/customer/cart')} className="dashboard-action-button cart-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Keranjang
          </button>
          <button onClick={() => navigateTo('/customer/orders')} className="dashboard-action-button orders-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Pesanan
          </button>
        </div>
      </div>
      
      {/* Feature Cards - Dimodifikasi dari card lama */}
      <div className="feature-cards">
        <div className="feature-card" onClick={() => navigateTo('/customer/products')}>
          <div className="feature-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Produk</h3>
            <p>Jelajahi semua kategori produk</p>
          </div>
        </div>
        
        <div className="feature-card" onClick={() => navigateTo('/customer/cart')}>
          <div className="feature-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Keranjang</h3>
            <p>Kelola belanjaan Anda</p>
          </div>
        </div>
        
        <div className="feature-card" onClick={() => navigateTo('/customer/orders')}>
          <div className="feature-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Pesanan</h3>
            <p>Pantau status pesanan Anda</p>
          </div>
        </div>
        
        <div className="feature-card" onClick={() => navigateTo('/customer/profile')}>
          <div className="feature-card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="feature-card-text">
            <h3>Profil</h3>
            <p>Atur informasi akun Anda</p>
          </div>
        </div>
      </div>

      {/* Product Recommendations Section with New Style */}
      <div className="product-recommendations">
        <div className="section-header">
          <h2>Rekomendasi Untuk Anda</h2>
          <button onClick={() => navigateTo('/customer/products')} className="view-all-button">
            Lihat Semua
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <div 
                key={product.id} 
                className="product-card-new"
                onClick={() => navigateToProductDetail(product)}
              >
                <div className="product-image-container">
                  <img 
                    src={getImageUrl(product.image)} 
                    alt={product.name_product} 
                    className="product-image" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.classList.add("image-error");
                      e.target.parentNode.classList.add("image-error-container");
                      e.target.parentNode.innerHTML = "<div class='product-image-placeholder'><span>Gambar Tidak Tersedia</span></div>";
                    }}
                  />
                </div>
                <div className="product-info">
                  <div className="product-details-new">
                    <h4 className="product-name-new">{product.name_product}</h4>
                    <div className="product-price-wrapper">
                      <p className="product-price-new">{formatPrice(product.price)}</p>
                      <div className="product-cart-icon" onClick={(e) => addToCart(e, product)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="9" cy="21" r="1"></circle>
                          <circle cx="20" cy="21" r="1"></circle>
                          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-products">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Tidak ada produk yang tersedia saat ini</p>
              <button className="refresh-button" onClick={() => window.location.reload()}>
                Muat Ulang
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-nav">
        <div className="bottom-nav-container">
          <button 
            className={`bottom-nav-item ${window.location.pathname === '/customer/dashboard' ? 'active' : ''}`}
            onClick={() => navigateTo('/customer/dashboard')}
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
            onClick={() => navigateTo('/customer/products')}
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
            onClick={() => navigateTo('/customer/cart')}
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
            onClick={() => navigateTo('/customer/orders')}
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
            onClick={() => navigateTo('/customer/profile')}
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

export default DashboardCustomer;