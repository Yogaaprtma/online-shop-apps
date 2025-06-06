import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "/src/services/api.js"; // Pastikan path ini benar
import "/src/styles/admin/products/edit.css";

// Komponen ikon sederhana (opsional, bisa diganti library ikon)
const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const formatNumberForDisplay = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return '';

  let numValue;

  // Jika 'value' sudah berupa angka, langsung gunakan.
  if (typeof value === 'number') {
    numValue = value;
  } else {
    // Jika 'value' adalah string (misalnya dari API "2000.00" atau dari input pengguna "2000" tanpa titik)
    // parseFloat akan mengkonversinya dengan benar.
    // "2000.00" -> 2000
    // "2000"    -> 2000
    numValue = parseFloat(String(value));
  }

  // Jika hasil parsing bukan angka (misalnya jika input tidak valid)
  if (isNaN(numValue)) {
    return ''; // Kembalikan string kosong atau bisa juga nilai input asli jika gagal parse
  }

  // Format ke Rupiah tanpa angka desimal (karena Rupiah biasanya tidak pakai sen)
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0, // Tidak ada angka di belakang koma
    maximumFractionDigits: 0  // Tidak ada angka di belakang koma
  }).format(numValue);
};

const unformatNumberForApi = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\./g, '');
};

const EditProductAdmin = () => {
  const [formData, setFormData] = useState({
    name_product: "",
    description: "",
    price: "", // Akan disimpan sebagai string terformat di state
    stock: "",
  });
  const [initialProductName, setInitialProductName] = useState("");
  const [image, setImage] = useState(null); // File object untuk upload baru
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // URL gambar yang sudah ada
  const [previewUrl, setPreviewUrl] = useState(null); // URL preview untuk gambar baru/lama
  const [errors, setErrors] = useState({}); // Untuk validation errors
  const [submitError, setSubmitError] = useState(null); // Untuk error submit umum
  const [success, setSuccess] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true); // Loading data awal
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading saat submit

  const navigate = useNavigate();
  const { id } = useParams();

  const fetchProduct = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setSubmitError(null);
      setErrors({});
      const response = await api.get(`/products/${id}`);
      const productData = response.data.data;
      console.log("Harga dari API (productData.price):", productData.price, typeof productData.price); // SANGAT PENTING!

      const formattedPrice = formatNumberForDisplay(productData.price);
      console.log("Harga setelah formatNumberForDisplay:", formattedPrice);

      setFormData({
        name_product: productData.name_product || "",
        description: productData.description || "",
        // price: formatNumberForDisplay(productData.price),
        price: formattedPrice, // Gunakan variabel yang sudah di-log
        stock: productData.stock || "",
      });
      setInitialProductName(productData.name_product || "Produk");

      if (productData.image) {
        const imageUrl = productData.image.startsWith('http')
          ? productData.image
          : `${import.meta.env.VITE_APP_URL || 'http://127.0.0.1:8000'}/storage/${productData.image}`;
        setCurrentImageUrl(imageUrl);
        setPreviewUrl(imageUrl); // Set preview ke gambar yang sudah ada
      }
    } catch (err) {
      console.error("Gagal mengambil data produk:", err);
      setSubmitError(err.response?.data?.message || "Gagal mengambil data produk. Pastikan produk ada.");
    } finally {
      setIsLoadingData(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "price") {
      const rawValue = value.replace(/[^\d]/g, '');
      setFormData(prev => ({ ...prev, price: rawValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handlePriceBlur = () => {
    setFormData(prev => ({
      ...prev,
      price: formatNumberForDisplay(prev.price)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Maks 2MB
        setErrors(prev => ({ ...prev, image: "Ukuran gambar maksimal 2MB."}));
        setPreviewUrl(currentImageUrl); // Kembali ke gambar lama jika ada
        setImage(null);
        e.target.value = null; // Reset file input
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: "Format gambar tidak valid. Gunakan JPG, PNG, GIF, atau SVG."}));
        setPreviewUrl(currentImageUrl);
        setImage(null);
        e.target.value = null;
        return;
      }

      setImage(file);
      setErrors(prev => ({ ...prev, image: null})); // Clear error gambar
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null); // Hapus file baru yang dipilih
    setPreviewUrl(currentImageUrl); // Kembali ke gambar lama jika ada, atau null jika tidak ada gambar lama
    // Kosongkan input file jika perlu (bisa lebih kompleks, kadang cukup set e.target.value = null di handleImageChange)
    const fileInput = document.getElementById('productImageInput');
    if (fileInput) {
      fileInput.value = null;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name_product.trim()) newErrors.name_product = "Nama produk tidak boleh kosong.";
    if (formData.name_product.length > 255) newErrors.name_product = "Nama produk maksimal 255 karakter.";

    const priceNum = parseFloat(unformatNumberForApi(formData.price));
    if (isNaN(priceNum) || priceNum < 0) newErrors.price = "Harga harus angka positif.";
    
    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) newErrors.stock = "Stok harus angka positif (integer).";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    if (!validateForm()) {
      setSubmitError("Harap perbaiki error pada form.");
      return;
    }

    setIsSubmitting(true);

    const productData = new FormData();
    productData.append('name_product', formData.name_product);
    productData.append('description', formData.description || '');
    productData.append('price', unformatNumberForApi(formData.price));
    productData.append('stock', formData.stock);

    if (image) { // Jika ada gambar baru yang diupload
      productData.append('image', image);
    }
    // Jika tidak ada gambar baru dan ingin menghapus gambar lama, Anda perlu logika/API khusus
    // Untuk saat ini, jika tidak ada 'image' baru, gambar lama di backend tidak akan diubah kecuali controller menghapusnya.

    try {
      // Laravel mengharapkan POST untuk update dengan file, dan _method untuk spoofing
      await api.post(`/products/${id}?_method=PUT`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess("Produk berhasil diperbarui! Mengarahkan kembali...");
      setTimeout(() => {
        navigate("/admin/products");
      }, 2000);
    } catch (err) {
      console.error("Gagal memperbarui produk:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Tangani error validasi dari Laravel
        const backendErrors = err.response.data.errors;
        const newErrorState = {};
        for (const key in backendErrors) {
          newErrorState[key] = backendErrors[key].join(' '); // Ambil pesan error pertama
        }
        setErrors(newErrorState);
        setSubmitError("Terdapat kesalahan validasi pada input Anda.");
      } else {
        setSubmitError(err.response?.data?.message || "Terjadi kesalahan saat memperbarui produk.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen">
          <div className="spinner"></div>
          <p>Memuat Data Produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/products">Produk</Link></li>
          <li aria-current="page">Edit: {initialProductName}</li>
        </ol>
      </nav>

      <header className="admin-content-header">
        <h1>Edit Produk: <span className="product-name-header">{initialProductName}</span></h1>
      </header>

      {submitError && <div className="alert alert-danger main-submit-error">{submitError}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="edit-product-form card">
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name_product">Nama Produk <span className="required-asterisk">*</span></label>
              <input
                type="text"
                id="name_product"
                name="name_product"
                value={formData.name_product}
                onChange={handleChange}
                className={`form-control ${errors.name_product ? 'is-invalid' : ''}`}
              />
              {errors.name_product && <div className="invalid-feedback">{errors.name_product}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group column-half">
              <label htmlFor="price">Harga <span className="required-asterisk">*</span></label>
              <div className="input-group">
                <span className="input-group-text">Rp</span>
                <input
                  type="text" // Tetap text untuk format, validasi angka dilakukan manual
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  onBlur={handlePriceBlur}
                  className={`form-control price-input ${errors.price ? 'is-invalid' : ''}`}
                  placeholder="Contoh: 1.000.000"
                />
              </div>
              {errors.price && <div className="invalid-feedback">{errors.price}</div>}
            </div>

            <div className="form-group column-half">
              <label htmlFor="stock">Stok <span className="required-asterisk">*</span></label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className={`form-control ${errors.stock ? 'is-invalid' : ''}`}
              />
              {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Deskripsi</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            ></textarea>
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="productImageInput">Gambar Produk</label>
            <div className="image-upload-wrapper">
              <input
                type="file"
                id="productImageInput"
                accept="image/jpeg,image/png,image/gif,image/svg+xml"
                onChange={handleImageChange}
                className="form-control-file"
              />
              <small className="form-text text-muted">
                Format: JPG, PNG, GIF, SVG. Maks 2MB. Kosongkan jika tidak ingin mengubah gambar.
              </small>
              {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
            </div>

            {previewUrl && (
              <div className="image-preview-wrapper">
                <img src={previewUrl} alt="Preview Produk" className="image-preview-admin" />
                { (image || currentImageUrl) && /* Tampilkan tombol hapus hanya jika ada gambar baru ATAU gambar lama */
                  <button
                    type="button"
                    onClick={removeImage}
                    className="btn-remove-image"
                    title="Hapus atau Batalkan Perubahan Gambar"
                  >
                    <Icon name="times-circle" />
                  </button>
                }
              </div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isLoadingData}
          >
            {isSubmitting ? <><span className="spinner-btn"></span> Menyimpan...</> : <><Icon name="save" /> Simpan Perubahan</>}
          </button>
          <Link to="/admin/products" className="btn btn-outline-secondary" disabled={isSubmitting}>
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
};

export default EditProductAdmin;