import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/customer/customer-products.css";

const CustomerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortBy]);

  const fetchProducts = async () => {
    try {
        console.log("Mengambil semua data produk...");
        const response = await api.get("/products?per_page=all");
        console.log("API Response:", response.data); 
        
        // Handle paginated response - extract the actual products array
        const productsData = response.data.data?.data || response.data.data || [];
        console.log("Products Data:", productsData); // Debug log
        
        setProducts(Array.isArray(productsData) ? productsData : []);
        setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data produk:", error);
      setProducts([]); // Set empty array on error
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    // Ensure products is an array before filtering
    if (!Array.isArray(products)) {
      console.warn("Products is not an array:", products);
      setFilteredProducts([]);
      return;
    }

    let filtered = products.filter(product =>
      product.name_product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name_product?.localeCompare(b.name_product) || 0;
        case "price-low":
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case "price-high":
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case "stock":
          return (b.stock || 0) - (a.stock || 0);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "/placeholder-product.png";
    if (imagePath.startsWith('http')) return imagePath;
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

  const addToCart = async (e, product) => {
    e.stopPropagation();
    
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
    
    const closeBtn = modal.querySelector(".modal-close-btn");
    const cancelBtn = modal.querySelector(".modal-cancel-btn");
    const confirmBtn = modal.querySelector(".add-to-cart-confirm-btn");
    const quantityInput = modal.querySelector(".quantity-input");
    const decreaseBtn = modal.querySelector(".quantity-decrease");
    const increaseBtn = modal.querySelector(".quantity-increase");
    
    closeBtn.addEventListener("click", () => modal.remove());
    cancelBtn.addEventListener("click", () => modal.remove());
    
    decreaseBtn.addEventListener("click", () => {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    
    increaseBtn.addEventListener("click", () => {
      let currentValue = parseInt(quantityInput.value);
      if (currentValue < product.stock) {
        quantityInput.value = currentValue + 1;
      }
    });
    
    quantityInput.addEventListener("change", () => {
      let value = parseInt(quantityInput.value);
      if (isNaN(value) || value < 1) {
        quantityInput.value = 1;
      } else if (value > product.stock) {
        quantityInput.value = product.stock;
      }
    });
    
    confirmBtn.addEventListener("click", async () => {
      try {
        const quantity = parseInt(quantityInput.value);
        
        await api.post("/cart", {
          product_id: product.id,
          quantity: quantity
        });
        
        modal.remove();
        
        loadSweetAlert()
          .then((Swal) => {
            Swal.fire({
              icon: "success",
              title: "Berhasil!",
              text: `${product.name_product} telah ditambahkan ke keranjang`,
              confirmButtonColor: "#6366f1",
              showCancelButton: true,
              cancelButtonText: "Lanjut Belanja",
              confirmButtonText: "Lihat Keranjang"
            }).then((result) => {
              if (result.isConfirmed) {
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

  if (loading) {
    return (
      <div className="products-loading">
        <div className="spinner"></div>
        <p>Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="customer-products-container">
      {/* Header */}
      <div className="products-header">
        <div className="header-top">
          <div className="header-info">
            <h1>Semua Produk</h1>
            <p>Temukan produk terbaik untuk kebutuhan Anda</p>
          </div>
          <button 
            onClick={() => navigate('/customer/dashboard')}
            className="back-to-dashboard-btn"
          >
            Kembali ke Dashboard
          </button>
        </div>
        
        {/* Search and Filter */}
        <div className="search-filter-container">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="name">Urutkan: Nama A-Z</option>
            <option value="price-low">Urutkan: Harga Terendah</option>
            <option value="price-high">Urutkan: Harga Tertinggi</option>
            <option value="stock">Urutkan: Stok Terbanyak</option>
          </select>
        </div>
        
        {/* Results Count */}
        <p className="results-count">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigateToProductDetail(product)}
              className="product-card"
            >
              <div className="product-image-container">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.name_product}
                  className="product-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-product.png';
                  }}
                />
                {product.stock === 0 && (
                  <div className="out-of-stock-overlay">
                    STOK HABIS
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <h3 className="product-name">{product.name_product}</h3>
                
                {product.description && (
                  <p className="product-description">{product.description}</p>
                )}
                
                <div className="product-bottom">
                  <div className="price-stock-info">
                    <p className="product-price">{formatPrice(product.price)}</p>
                    <p className={`product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                      Stok: {product.stock}
                    </p>
                  </div>
                  
                  {product.stock > 0 && (
                    <button
                      onClick={(e) => addToCart(e, product)}
                      className="add-to-cart-btn"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-products-found">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <h3>Tidak ada produk ditemukan</h3>
          <p>
            {searchTerm ? `Tidak ada produk yang cocok dengan pencarian "${searchTerm}"` : 'Belum ada produk yang tersedia'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-filter-btn"
            >
              Hapus Filter
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerProducts;