import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/products/admin-product.css";

const PRODUCTS_PER_PAGE = 8;

const ProductList = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOption, setSortOption] = useState("default");
  const [currentPage, setCurrentPage] = useState(1);
  const [failedImages, setFailedImages] = useState(new Set()); // State untuk melacak gambar yang gagal dimuat

  const navigate = useNavigate();

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await api.get("/products");
        setAllProducts(response.data.data || []);
      } catch (err) {
        setError("Gagal mengambil data produk. Pastikan Anda memiliki akses admin.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    try {
      const Swal = await loadSweetAlert();
      const result = await Swal.fire({
        title: "Apakah Anda yakin?",
        text: "Produk ini akan dihapus secara permanen!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#FF5C5C",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        background: "#FFFFFF",
        customClass: {
          title: "swal-title",
          content: "swal-content",
          confirmButton: "swal-confirm",
          cancelButton: "swal-cancel",
        }
      });

      if (result.isConfirmed) {
        await api.delete(`/products/${id}`);
        setAllProducts(prevProducts => prevProducts.filter((product) => product.id !== id));
        Swal.fire({
          title: "Terhapus!",
          text: "Produk berhasil dihapus.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error(err.message);
      setError("Gagal menghapus produk.");
      try {
        const Swal = await loadSweetAlert();
        Swal.fire({
          title: "Error!",
          text: "Gagal menghapus produk.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } catch {
        alert("Gagal menghapus produk.");
      }
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  const processedProducts = useMemo(() => {
    let productsToProcess = [...allProducts];

    if (searchTerm) {
      productsToProcess = productsToProcess.filter((product) =>
        product.name_product.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      productsToProcess = productsToProcess.filter((product) => {
        if (filterStatus === "in-stock") return product.stock > 10;
        if (filterStatus === "low-stock") return product.stock > 0 && product.stock <= 10;
        if (filterStatus === "out-of-stock") return product.stock <= 0;
        return true;
      });
    }

    productsToProcess.sort((a, b) => {
      if (sortOption === "price-asc") return a.price - b.price;
      if (sortOption === "price-desc") return b.price - a.price;
      if (sortOption === "name-asc") return a.name_product.localeCompare(b.name_product);
      if (sortOption === "name-desc") return b.name_product.localeCompare(a.name_product);
      if (sortOption === "stock-asc") return a.stock - b.stock;
      if (sortOption === "stock-desc") return b.stock - a.stock;
      return 0;
    });

    return productsToProcess;
  }, [allProducts, searchTerm, filterStatus, sortOption]);

  const totalPages = Math.ceil(processedProducts.length / PRODUCTS_PER_PAGE);
  const indexOfLastProduct = currentPage * PRODUCTS_PER_PAGE;
  const indexOfFirstProduct = indexOfLastProduct - PRODUCTS_PER_PAGE;
  const currentProductsToDisplay = processedProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  }

  const getStockStatus = (stock) => {
    if (stock <= 0) return "out-of-stock";
    if (stock < 10) return "low-stock";
    return "in-stock";
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log("Image path is null or undefined, using placeholder");
      return "/placeholder-product.png";
    }
    if (imagePath.startsWith('http')) {
      console.log("Image path is an external URL:", imagePath);
      return imagePath;
    }
    const url = `${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'}/storage/${imagePath}`;
    console.log("Generated image URL:", url);
    return url;
  };
  
  const handleImageError = (productId) => {
    setFailedImages(prev => new Set(prev).add(productId));
  };

  const productStats = useMemo(() => ({
    total: allProducts.length,
    inStock: allProducts.filter(p => p.stock > 10).length,
    lowStock: allProducts.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: allProducts.filter(p => p.stock <= 0).length
  }), [allProducts]);

  const formatPrice = (price) => {
    return "Rp " + Math.round(price).toLocaleString("id-ID");
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= halfPagesToShow + 1) {
        for (let i = 1; i <= maxPagesToShow - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - halfPagesToShow) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - halfPagesToShow + 1; i <= currentPage + halfPagesToShow -1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };

  return (
    <div className="product-list-page">
      <div className="page-container">
        <div className="product-list-container">
          <nav aria-label="breadcrumb" className="product-breadcrumb">
            <ol>
              <li><Link to="/admin/dashboard">Admin</Link></li>
              <li aria-current="page">Daftar Produk</li>
            </ol>
          </nav>

          <div className="product-header">
            <div className="header-content">
              <h2 className="product-list-title">Daftar Produk</h2>
              <p className="product-subtitle">Kelola semua produk toko Anda</p>
            </div>
            <div className="add-product-button">
              <Link to="/admin/products/add" className="btn-add-product">
                <i className="fas fa-plus-circle"></i> Tambah Produk
              </Link>
            </div>
          </div>

          <div className="product-stats-dashboard">
            <div className="stat-card total-products">
              <div className="stat-icon"><i className="fas fa-boxes"></i></div>
              <div className="stat-content">
                <h3 className="stat-value">{productStats.total}</h3>
                <p className="stat-label">Total Produk</p>
              </div>
            </div>
            <div className="stat-card in-stock-products">
              <div className="stat-icon"><i className="fas fa-check-double"></i></div>
              <div className="stat-content">
                <h3 className="stat-value">{productStats.inStock}</h3>
                <p className="stat-label">Stok Tersedia</p>
              </div>
            </div>
            <div className="stat-card low-stock-products">
              <div className="stat-icon"><i className="fas fa-exclamation-triangle"></i></div>
              <div className="stat-content">
                <h3 className="stat-value">{productStats.lowStock}</h3>
                <p className="stat-label">Stok Menipis</p>
              </div>
            </div>
            <div className="stat-card out-of-stock-products">
              <div className="stat-icon"><i className="fas fa-times-circle"></i></div>
              <div className="stat-content">
                <h3 className="stat-value">{productStats.outOfStock}</h3>
                <p className="stat-label">Stok Habis</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <div className="message-icon error-icon"><i className="fas fa-exclamation-circle"></i></div>
              <div className="message-content">
                <h4 className="message-title">Terjadi Kesalahan</h4>
                <p className="message-text">{error}</p>
              </div>
              <button className="dismiss-error" onClick={() => setError(null)}><i className="fas fa-times"></i></button>
            </div>
          )}

          <div className="search-filter-container">
            <div className="search-container">
              <div className="search-input-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama..."
                  className="search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button className="clear-search" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="filter-sort-container">
              <div className="filter-buttons">
                {['all', 'in-stock', 'low-stock', 'out-of-stock'].map(status => (
                  <button
                    key={status}
                    className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                    onClick={() => handleFilterChange(status)}
                  >
                    {status === 'all' ? 'Semua' :
                     status === 'in-stock' ? 'Stok Tersedia' :
                     status === 'low-stock' ? 'Stok Menipis' : 'Stok Habis'}
                  </button>
                ))}
              </div>
              <div className="sort-dropdown">
                <label htmlFor="sort-select">Urutkan:</label>
                <select id="sort-select" onChange={handleSortChange} value={sortOption} className="sort-select">
                  <option value="default">Default</option>
                  <option value="name-asc">Nama (A-Z)</option>
                  <option value="name-desc">Nama (Z-A)</option>
                  <option value="price-asc">Harga (Terendah)</option>
                  <option value="price-desc">Harga (Tertinggi)</option>
                  <option value="stock-asc">Stok (Terendah)</option>
                  <option value="stock-desc">Stok (Tertinggi)</option>
                </select>
              </div>
            </div>
            <div className="search-stats">
              {processedProducts.length > 0 ? (
                <span>
                  Menampilkan {currentProductsToDisplay.length} dari {processedProducts.length} produk 
                  {searchTerm ? ` untuk "${searchTerm}"` : ""}
                </span>
              ) : (
                <span>Tidak ada produk {searchTerm ? `dengan kata kunci "${searchTerm}"` : ""}</span>
              )}
            </div>
          </div>

          <div className="products-grid">
            {loading ? (
              <div className="loading-container">
                <div className="modern-loading">
                  <div className="loading-cube"><div className="cube-face cube-front"></div><div className="cube-face cube-back"></div><div className="cube-face cube-right"></div><div className="cube-face cube-left"></div><div className="cube-face cube-top"></div><div className="cube-face cube-bottom"></div></div>
                  <div className="loading-dots"><span></span><span></span><span></span></div>
                </div>
                <p className="loading-text">Memuat produk...</p>
              </div>
            ) : currentProductsToDisplay.length > 0 ? (
              currentProductsToDisplay.map((product, index) => (
                <div key={product.id} className="product-item" style={{"--animation-order": index}}>
                  <div className="product-image-container">
                    <div className="product-badges">
                      {product.stock <= 0 && <span className="product-badge sold-out">Habis</span>}
                      {product.stock > 0 && product.stock < 10 && <span className="product-badge low-stock">Stok Terbatas</span>}
                    </div>
                    <img 
                      src={failedImages.has(product.id) ? "/placeholder-product.png" : getImageUrl(product.image)} 
                      alt={product.name_product}
                      className="product-image"
                      onError={() => handleImageError(product.id)}
                    />
                  </div>
                  <div className="product-content">
                    <h3 className="product-name">{product.name_product}</h3>
                    <p className="product-description">
                      {product.description ? (product.description.length > 70 ? `${product.description.substring(0, 70)}...` : product.description) : "Tidak ada deskripsi"}
                    </p>
                    <div className="product-details">
                      <div className="price-block">
                        <span className="price-label">Harga</span>
                        <span className="price-value">{formatPrice(product.price)}</span>
                      </div>
                      <div className={`stock-block ${getStockStatus(product.stock)}`}>
                        <div className="stock-meter"><div className="stock-level" style={{width: `${product.stock > 100 ? 100 : (product.stock > 0 ? product.stock : 0)}%`}}></div></div>
                        <div className="stock-text"><span className="stock-indicator"></span><span className="stock-value">Stok: {product.stock}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="product-actions">
                    <Link to={`/admin/products/detail/${product.id}`} className="btn-lihat" title="Lihat detail produk"><i className="fas fa-eye"></i> <span>Lihat</span></Link>
                    <Link to={`/admin/products/edit/${product.id}`} className="btn-edit" title="Edit produk"><i className="fas fa-edit"></i> <span>Edit</span></Link>
                    <button onClick={() => handleDelete(product.id)} className="btn-delete" title="Hapus produk"><i className="fas fa-trash"></i> <span>Hapus</span></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-products">
                <div className="no-products-icon"><i className="fas fa-box-open"></i></div>
                <h3 className="no-products-title">{searchTerm || filterStatus !== 'all' ? "Tidak ditemukan produk" : "Belum ada produk"}</h3>
                <p className="no-products-text">{searchTerm ? `Tidak ditemukan produk dengan kata kunci "${searchTerm}"` : filterStatus !== 'all' ? `Tidak ada produk dengan filter "${filterStatus === 'in-stock' ? 'Stok Tersedia' : filterStatus === 'low-stock' ? 'Stok Menipis' : 'Stok Habis'}"` : "Belum ada produk yang ditambahkan ke dalam sistem"}</p>
                <div className="no-products-actions">
                  {(searchTerm || filterStatus !== 'all') && (<button className="clear-filters-button" onClick={() => { setSearchTerm(""); setFilterStatus("all"); setCurrentPage(1);}}><i className="fas fa-times-circle"></i> Reset Filter</button>)}
                  {!searchTerm && filterStatus === 'all' && (<Link to="/admin/products/add" className="no-products-button"><i className="fas fa-plus-circle"></i> Tambah Produk Sekarang</Link>)}
                </div>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-button prev" 
                onClick={prevPage} 
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i> Sebelumnya
              </button>
              
              <div className="pagination-numbers">
                {getPageNumbers().map((page, index) => 
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={page}
                      className={`pagination-page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => goToPage(page)}
                      disabled={currentPage === page}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button 
                className="pagination-button next" 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
              >
                Selanjutnya <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
          {totalPages > 0 && processedProducts.length > PRODUCTS_PER_PAGE && (
            <div className="pagination-info-simple">
              Halaman <span className="current-page">{currentPage}</span> dari <span className="total-pages">{totalPages}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;