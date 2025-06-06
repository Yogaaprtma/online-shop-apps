import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/products/add.css";

// Komponen ikon sederhana (opsional, bisa diganti library ikon)
const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

// Fungsi format harga yang konsisten
const formatNumberForDisplay = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const rawValue = String(value).replace(/[^\d]/g, '');
  if (rawValue === '') return '';
  return new Intl.NumberFormat('id-ID').format(parseFloat(rawValue));
};

const unformatNumberForApi = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\./g, '');
};


const AddProductAdmin = () => {
  const [formData, setFormData] = useState({
    name_product: "",
    description: "",
    price: "", // Disimpan sebagai string terformat
    stock: "",
  });
  const [image, setImage] = useState(null); // File object
  const [imagePreview, setImagePreview] = useState(null); // URL untuk preview
  const [errors, setErrors] = useState({}); // Untuk validation errors per field
  const [submitError, setSubmitError] = useState(null); // Untuk error submit umum
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      // Hanya simpan angka di state untuk 'price' jika sedang diketik
      const rawValue = value.replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, price: rawValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Hapus error untuk field yang sedang diubah
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePriceBlur = () => {
    // Format harga saat input kehilangan fokus
    setFormData(prev => ({
      ...prev,
      price: formatNumberForDisplay(prev.price)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSubmitError(null); // Reset error submit umum
    setErrors(prev => ({ ...prev, image: null })); // Reset error gambar spesifik

    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Maks 2MB
        setErrors(prev => ({...prev, image: "Ukuran gambar maksimal 2MB."}));
        setImage(null);
        setImagePreview(null);
        e.target.value = null;
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({...prev, image: "Format gambar tidak valid (JPG, PNG, GIF, SVG)."}));
        setImage(null);
        setImagePreview(null);
        e.target.value = null;
        return;
      }

      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImagePreview = () => {
    setImage(null);
    setImagePreview(null);
    // Reset input file
    const fileInput = document.getElementById('productImageInput');
    if (fileInput) {
      fileInput.value = null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name_product.trim()) newErrors.name_product = "Nama produk tidak boleh kosong.";
    if (formData.name_product.length > 255) newErrors.name_product = "Nama produk maksimal 255 karakter.";
    
    const priceNum = parseFloat(unformatNumberForApi(formData.price)); // Gunakan unformat sebelum validasi
    if (isNaN(priceNum) || priceNum < 0) newErrors.price = "Harga harus angka positif.";
    else if (String(unformatNumberForApi(formData.price)).length === 0) newErrors.price = "Harga tidak boleh kosong.";


    if (formData.stock.trim() === "") newErrors.stock = "Stok tidak boleh kosong.";
    else {
        const stockNum = parseInt(formData.stock, 10);
        if (isNaN(stockNum) || stockNum < 0) newErrors.stock = "Stok harus angka integer positif.";
    }
    // Gambar tidak wajib untuk produk baru, jadi tidak divalidasi di sini kecuali ada aturan lain

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null); // Reset error umum setiap submit
    setSuccess(null);

    if (!validateForm()) {
      setSubmitError("Harap perbaiki error pada form sebelum mengirim.");
      return;
    }

    setIsSubmitting(true);

    const productFormData = new FormData();
    productFormData.append('name_product', formData.name_product);
    productFormData.append('description', formData.description || ''); // Kirim string kosong jika null/undefined
    productFormData.append('price', unformatNumberForApi(formData.price)); // Kirim harga tanpa format
    productFormData.append('stock', formData.stock);

    if (image) {
      productFormData.append('image', image);
    }

    try {
      await api.post("/products", productFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess("Produk berhasil ditambahkan! Mengarahkan kembali...");
      setFormData({ name_product: "", description: "", price: "", stock: "" });
      setImage(null);
      setImagePreview(null);
      setErrors({}); // Clear semua errors
      setTimeout(() => {
        navigate("/admin/products");
      }, 2000);
    } catch (err) {
      console.error("Gagal menambahkan produk:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        const backendErrors = err.response.data.errors;
        const newErrorState = {};
        for (const key in backendErrors) {
          newErrorState[key] = backendErrors[key].join(' ');
        }
        setErrors(newErrorState);
        setSubmitError("Terdapat kesalahan validasi pada input Anda.");
      } else {
        setSubmitError(err.response?.data?.message || "Terjadi kesalahan saat menambahkan produk.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-page-container"> {/* Kontainer utama yang konsisten */}
      {/* Breadcrumb disesuaikan */}
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/products">Produk</Link></li>
          <li aria-current="page">Tambah Produk Baru</li>
        </ol>
      </nav>

      {/* Header halaman disesuaikan */}
      <header className="admin-content-header">
        <h1>Tambah Produk Baru</h1>
      </header>

      {/* Pesan error/sukses umum */}
      {submitError && <div className="alert alert-danger main-submit-error">{submitError}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form dalam card */}
      <form onSubmit={handleSubmit} className="add-product-form card">
        <div className="card-body">
          {/* Grid untuk layout form, bisa 1 atau 2 kolom */}
          <div className="form-layout-grid">
            {/* Kolom Kiri: Info Dasar */}
            <div className="form-column">
              <div className="form-section">
                <h3 className="section-title">Informasi Dasar</h3>
                <div className="form-group">
                  <label htmlFor="name_product">Nama Produk <span className="required-asterisk">*</span></label>
                  <input
                    type="text"
                    id="name_product"
                    name="name_product"
                    value={formData.name_product}
                    onChange={handleChange}
                    className={`form-control ${errors.name_product ? 'is-invalid' : ''}`}
                    placeholder="Contoh: Kemeja Lengan Panjang"
                  />
                  {errors.name_product && <div className="invalid-feedback">{errors.name_product}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="price">Harga <span className="required-asterisk">*</span></label>
                  <div className="input-group">
                    <span className="input-group-text">Rp</span>
                    <input
                      type="text"
                      id="price"
                      name="price"
                      value={formData.price} // State price sudah berisi angka saja saat diketik
                      onChange={handleChange}
                      onBlur={handlePriceBlur} // Format saat blur
                      className={`form-control price-input ${errors.price ? 'is-invalid' : ''}`}
                      placeholder="Contoh: 150.000"
                    />
                  </div>
                  {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stok <span className="required-asterisk">*</span></label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
                    placeholder="Jumlah stok tersedia"
                  />
                  {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Deskripsi & Gambar */}
            <div className="form-column">
              <div className="form-section">
                 <h3 className="section-title">Deskripsi & Media</h3>
                <div className="form-group">
                  <label htmlFor="description">Deskripsi Produk</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="6"
                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                    placeholder="Jelaskan detail produk, bahan, ukuran, dll."
                  ></textarea>
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>

                <div className="form-group">
                  <label htmlFor="productImageInput">Gambar Produk</label>
                  <div className="image-upload-area">
                    <input
                      type="file"
                      id="productImageInput"
                      accept="image/jpeg,image/png,image/gif,image/svg+xml"
                      onChange={handleImageChange}
                      className="image-upload-input" // Sembunyikan input asli
                    />
                    {!imagePreview ? (
                      <label htmlFor="productImageInput" className="image-upload-label">
                        <Icon name="cloud-upload-alt" className="upload-icon-main" />
                        <span>Pilih gambar atau tarik ke sini</span>
                        <small>JPG, PNG, GIF, SVG (Maks 2MB)</small>
                      </label>
                    ) : (
                      <div className="image-preview-container">
                        <img src={imagePreview} alt="Preview Produk" className="image-preview-admin" />
                        <button
                          type="button"
                          onClick={removeImagePreview}
                          className="btn-remove-preview"
                          title="Hapus Gambar"
                        >
                          <Icon name="times" />
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <><span className="spinner-btn"></span> Menyimpan...</> : <><Icon name="save" /> Simpan Produk</>}
          </button>
          <Link to="/admin/products" className="btn btn-outline-secondary" disabled={isSubmitting}>
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AddProductAdmin;