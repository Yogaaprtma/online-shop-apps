import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api"; // Pastikan path ini sudah benar
import "../../styles/customer/product-detail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false); // Untuk loading tombol "Tambah ke Keranjang"
  const [isBuyingNow, setIsBuyingNow] = useState(false);     // Untuk loading tombol "Beli Sekarang"

  useEffect(() => {
    const fetchProduct = async () => {
      if (!product) {
        try {
          setLoading(true);
          const response = await api.get(`/products/${id}`);
          setProduct(response.data.data);
          setLoading(false);
        } catch (error) {
          console.error("Gagal mengambil detail produk:", error);
          // Jika produk tidak ditemukan atau ada error, arahkan ke halaman lain atau tampilkan pesan
          navigate("/customer/dashboard");
        }
      }
    };

    fetchProduct();
  }, [id, product, navigate]);

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
      script.onerror = () => {
        reject(new Error("Gagal memuat SweetAlert2 dari CDN"));
      };
      document.body.appendChild(script);
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= product.stock) {
      setQuantity(value);
    } else if (!isNaN(value) && value > product.stock) {
      setQuantity(product.stock); // Jika input > stok, set ke jumlah stok
    } else if (!isNaN(value) && value < 1) {
      setQuantity(1); // Jika input < 1, set ke 1
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  // --- FUNGSI DIPERBARUI ---
  const addToCart = async () => {
    if (!product || product.stock <= 0) return; // Jangan lakukan apa-apa jika stok habis
    setIsAddingToCart(true); // Aktifkan status loading

    try {
      // Kirim request ke backend untuk menambahkan item ke keranjang
      const response = await api.post('/cart', {
        product_id: product.id,
        quantity: quantity,
      });

      // Jika backend berhasil (biasanya status 201 atau 200)
      const Swal = await loadSweetAlert();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `${product.name_product} (${quantity} item) telah ditambahkan ke keranjang.`,
        confirmButtonText: "OK",
        confirmButtonColor: "#646cff",
      });
      // Anda bisa menambahkan logika untuk memperbarui ikon jumlah keranjang di Navbar jika ada
    } catch (error) {
      console.error("Gagal menambahkan ke keranjang:", error);
      const Swal = await loadSweetAlert();
      let errorMessage = "Gagal menambahkan item ke keranjang.";
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          // Menampilkan error validasi dari Laravel
          errorMessage = Object.values(error.response.data.errors).flat().join('\n');
        }
      }
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
        confirmButtonColor: "#d33", // Warna tombol error
      });
    } finally {
      setIsAddingToCart(false); // Nonaktifkan status loading
    }
  };

  // --- FUNGSI BARU ---
  const handleBuyNow = async () => {
    if (!product || product.stock <= 0) return;
    setIsBuyingNow(true);

    try {
      // 1. Tambahkan item ke keranjang (sama seperti fungsi addToCart)
      await api.post('/cart', {
        product_id: product.id,
        quantity: quantity,
      });

      // 2. Jika berhasil, arahkan ke halaman keranjang
      navigate('/customer/cart');

    } catch (error) {
      console.error("Proses Beli Sekarang Gagal:", error);
      const Swal = await loadSweetAlert();
      let errorMessage = "Gagal memproses permintaan Beli Sekarang.";
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          errorMessage = Object.values(error.response.data.errors).flat().join('\n');
        }
      }
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
        confirmButtonColor: "#d33",
      });
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="spinner"></div>
        <p>Memuat detail produk...</p>
      </div>
    );
  }

  // Jika produk tidak berhasil dimuat atau tidak ada
  if (!product) {
    return (
      <div className="product-detail-container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Produk tidak ditemukan</h2>
        <button onClick={() => navigate("/customer/dashboard")} className="back-button" style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-card">
        <div className="product-detail-back">
          <button onClick={() => navigate(-1)} className="back-button">
            &larr; Kembali
          </button>
        </div>

        <div className="product-detail-content">
          <div className="product-detail-image">
            {product.image ? (
              <img
                src={`${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'}/storage/${product.image}`}
                alt={product.name_product}
                className="product-detail-image-content"
              />
            ) : (
              <div className="product-detail-image-placeholder">
                <span>Gambar Produk</span>
              </div>
            )}
          </div>

          <div className="product-detail-info">
            <h1 className="product-detail-title">{product.name_product}</h1>

            <div className="product-detail-pricing">
              <div className="product-detail-price-actual">
                {formatPrice(product.price)}
              </div>
            </div>

            <div className="product-detail-description">
              <h3>Deskripsi Produk</h3>
              <p>{product.description || "Tidak ada deskripsi produk."}</p>
            </div>

            <div className="product-detail-stock">
              <p>Stok: <span className="stock-count">{product.stock}</span></p>
            </div>

            <div className="product-detail-quantity">
              <h3>Jumlah</h3>
              <div className="quantity-selector">
                <button
                  className="quantity-button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || product.stock <= 0} // Nonaktifkan jika stok 0
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock > 0 ? product.stock : 1} // Jika stok 0, max tetap 1 tapi akan dinonaktifkan
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="quantity-input"
                  disabled={product.stock <= 0} // Nonaktifkan jika stok 0
                />
                <button
                  className="quantity-button"
                  onClick={increaseQuantity}
                  disabled={quantity >= product.stock || product.stock <= 0} // Nonaktifkan jika stok 0
                >
                  +
                </button>
              </div>
            </div>

            <div className="product-detail-actions">
              <button
                className="add-to-cart-button-detail"
                onClick={addToCart}
                disabled={product.stock <= 0 || isAddingToCart || isBuyingNow} // Nonaktifkan jika stok habis atau sedang proses
              >
                {isAddingToCart ? 'Menambahkan...' : (product.stock > 0 ? "Tambahkan ke Keranjang" : "Stok Habis")}
              </button>

              <button
                className="buy-now-button"
                onClick={handleBuyNow}
                disabled={product.stock <= 0 || isAddingToCart || isBuyingNow} // Nonaktifkan jika stok habis atau sedang proses
              >
                {isBuyingNow ? 'Memproses...' : (product.stock > 0 ? "Beli Sekarang" : "Stok Habis")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;