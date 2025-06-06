import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "/src/services/api.js"; // Pastikan path ini benar
import "/src/styles/admin/products/detail.css";

// Komponen sederhana untuk ikon jika Anda tidak menggunakan library seperti react-fontawesome
const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const DetailProductAdmin = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error pada setiap fetch
        // Pastikan endpoint ini sesuai dengan route API Anda untuk mengambil produk oleh admin
        const response = await api.get(`/products/${id}`); // Ganti jika endpoint admin berbeda
        setProduct(response.data.data);
      } catch (err) {
        console.error("Gagal mengambil detail produk:", err);
        if (err.response && err.response.status === 404) {
          setError("Produk dengan ID ini tidak ditemukan.");
        } else {
          setError("Terjadi kesalahan saat mengambil data produk. Silakan coba lagi.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const getStockStatusClass = (stock) => {
    if (stock <= 0) return "status-out-of-stock";
    if (stock < 10) return "status-low-stock";
    return "status-in-stock";
  };

  const getStockStatusText = (stock) => {
    if (stock <= 0) return "Stok Habis";
    if (stock < 10) return `Stok Menipis (${stock})`;
    return `Tersedia (${stock} unit)`;
  };

  const formatPrice = (price) => {
    if (price === null || typeof price === 'undefined') return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen">
          <div className="spinner"></div>
          <p>Memuat Detail Produk...</p>
        </div>
      </div>
    );
  }

  if (error && !product) { // Hanya tampilkan error besar jika produk benar-benar gagal dimuat
    return (
      <div className="admin-page-container">
        <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol>
            <li><Link to="/admin/dashboard">Admin</Link></li>
            <li><Link to="/admin/products">Produk</Link></li>
            <li aria-current="page">Error</li>
          </ol>
        </nav>
        <div className="error-fullscreen">
          <Icon name="exclamation-triangle" className="error-icon-large" />
          <h2>Terjadi Kesalahan</h2>
          <p>{error}</p>
          <Link to="/admin/products" className="btn btn-primary">
            <Icon name="arrow-left" /> Kembali ke Daftar Produk
          </Link>
        </div>
      </div>
    );
  }

  if (!product) { // Jika loading selesai tapi produk null (misalnya tidak ditemukan)
     return (
      <div className="admin-page-container">
        <nav aria-label="breadcrumb" className="admin-breadcrumb">
          <ol>
            <li><Link to="/admin/dashboard">Admin</Link></li>
            <li><Link to="/admin/products">Produk</Link></li>
            <li aria-current="page">Tidak Ditemukan</li>
          </ol>
        </nav>
        <div className="error-fullscreen">
           <Icon name="search-minus" className="error-icon-large" />
          <h2>Produk Tidak Ditemukan</h2>
          <p>Produk yang Anda cari mungkin telah dihapus atau ID tidak valid.</p>
          <Link to="/admin/products" className="btn btn-primary">
            <Icon name="arrow-left" /> Kembali ke Daftar Produk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/products">Produk</Link></li>
          <li aria-current="page">{product.name_product || "Detail"}</li>
        </ol>
      </nav>

      <header className="admin-content-header">
        <h1>{product.name_product}</h1>
        <div className="header-actions">
          <Link to="/admin/products" className="btn btn-outline-secondary">
            <Icon name="arrow-left" /> Kembali
          </Link>
          <Link to={`/admin/products/edit/${product.id}`} className="btn btn-primary">
            <Icon name="edit" /> Edit Produk
          </Link>
        </div>
      </header>

      {error && <div className="alert alert-warning">{error}</div>} {/* Untuk error minor saat produk sudah ada */}

      <main className="admin-product-detail-grid">
        {/* Kolom Kiri: Gambar Produk */}
        <section className="product-image-section card">
          <div className="card-header">
            <h3>Gambar Produk</h3>
          </div>
          <div className="card-body">
            {product.image ? (
              <img
                src={`${import.meta.env.VITE_APP_URL || "http://127.0.0.1:8000"}/storage/${product.image}`}
                alt={product.name_product}
                className="product-detail-image-admin"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Gambar+Error'; e.target.alt = 'Gambar gagal dimuat';}}
              />
            ) : (
              <div className="image-placeholder-admin">
                <Icon name="image" className="placeholder-icon" />
                <p>Tidak ada gambar</p>
              </div>
            )}
          </div>
        </section>

        {/* Kolom Kanan: Detail Informasi */}
        <section className="product-info-section">
          <div className="card">
            <div className="card-header">
              <h3>Informasi Produk</h3>
              <span className={`status-badge ${getStockStatusClass(product.stock)}`}>
                {getStockStatusText(product.stock)}
              </span>
            </div>
            <div className="card-body">
              <ul className="info-list">
                <li>
                  <strong>ID Produk:</strong>
                  <span>{product.id}</span>
                </li>
                <li>
                  <strong>Nama:</strong>
                  <span>{product.name_product}</span>
                </li>
                <li>
                  <strong>Harga:</strong>
                  <span className="price-value">{formatPrice(product.price)}</span>
                </li>
                <li>
                  <strong>Stok Tersisa:</strong>
                  <span>{product.stock} unit</span>
                </li>
                <li>
                  <strong>Tanggal Dibuat:</strong>
                  <span>{formatDate(product.created_at)}</span>
                </li>
                <li>
                  <strong>Terakhir Diupdate:</strong>
                  <span>{formatDate(product.updated_at)}</span>
                </li>
                {/* Anda bisa tambahkan field lain seperti kategori, SKU, dll. */}
              </ul>
            </div>
          </div>

          <div className="card description-card">
            <div className="card-header">
              <h3>Deskripsi</h3>
            </div>
            <div className="card-body">
              {product.description ? (
                <div className="product-description-content" dangerouslySetInnerHTML={{ __html: product.description }}></div>
              ) : (
                <p className="text-muted"><em>Tidak ada deskripsi untuk produk ini.</em></p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DetailProductAdmin;