import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/users/add-edit-user.css";

const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const AddUserAdmin = () => {
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    no_telp: "",
    alamat: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nama.trim()) newErrors.nama = "Nama tidak boleh kosong.";
    if (!formData.email.trim()) newErrors.email = "Email tidak boleh kosong.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Format email tidak valid.";
    if (!formData.no_telp.trim()) newErrors.no_telp = "No. telepon tidak boleh kosong.";
    if (!formData.alamat.trim()) newErrors.alamat = "Alamat tidak boleh kosong.";
    if (!formData.password) newErrors.password = "Password tidak boleh kosong.";
    else if (formData.password.length < 8) newErrors.password = "Password minimal 8 karakter.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccess(null);

    if (!validateForm()) {
      setSubmitError("Harap perbaiki error pada form sebelum mengirim.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Secara eksplisit set role sebagai "user"
      const dataToSubmit = {
        ...formData,
        role: "user" // Role selalu user
      };
      await api.post("/admin/users", dataToSubmit); // Kirim sebagai JSON
      setSuccess("Pengguna baru berhasil ditambahkan! Mengarahkan ke daftar pengguna...");
      setTimeout(() => {
        navigate("/admin/users");
      }, 2500);
    } catch (err) {
      console.error("Gagal menambahkan pengguna:", err);
      if (err.response && err.response.data && err.response.data.errors) {
        setErrors(err.response.data.errors);
        setSubmitError("Terdapat kesalahan validasi pada input Anda.");
      } else {
        setSubmitError(err.response?.data?.message || "Terjadi kesalahan saat menambahkan pengguna.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="admin-page-container admin-user-form-page">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li><Link to="/admin/users">Kelola Pengguna</Link></li>
          <li aria-current="page">Tambah Pengguna Baru</li>
        </ol>
      </nav>

      <header className="admin-content-header">
        <h1>Tambah Pengguna Baru</h1>
      </header>

      {submitError && <div className="alert alert-danger main-submit-error">{submitError}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="user-form card">
        <div className="card-body">
          <div className="form-section-columns">
            <div className="form-column">
                <h3 className="form-section-title">Informasi Personal</h3>
                 <div className="form-group">
                    <label htmlFor="nama">Nama Lengkap <span className="required-asterisk">*</span></label>
                    <input type="text" id="nama" name="nama" value={formData.nama} onChange={handleChange} className={`form-control ${errors.nama ? 'is-invalid' : ''}`} />
                    {errors.nama && <div className="invalid-feedback">{typeof errors.nama === 'string' ? errors.nama : errors.nama[0]}</div>}
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email <span className="required-asterisk">*</span></label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`form-control ${errors.email ? 'is-invalid' : ''}`} />
                    {errors.email && <div className="invalid-feedback">{typeof errors.email === 'string' ? errors.email : errors.email[0]}</div>}
                </div>
                <div className="form-group">
                    <label htmlFor="no_telp">No. Telepon <span className="required-asterisk">*</span></label>
                    <input type="text" id="no_telp" name="no_telp" value={formData.no_telp} onChange={handleChange} className={`form-control ${errors.no_telp ? 'is-invalid' : ''}`} />
                    {errors.no_telp && <div className="invalid-feedback">{typeof errors.no_telp === 'string' ? errors.no_telp : errors.no_telp[0]}</div>}
                </div>
                 <div className="form-group">
                    <label htmlFor="alamat">Alamat Lengkap <span className="required-asterisk">*</span></label>
                    <textarea id="alamat" name="alamat" value={formData.alamat} onChange={handleChange} rows="3" className={`form-control ${errors.alamat ? 'is-invalid' : ''}`}></textarea>
                    {errors.alamat && <div className="invalid-feedback">{typeof errors.alamat === 'string' ? errors.alamat : errors.alamat[0]}</div>}
                </div>
            </div>
            <div className="form-column">
                <h3 className="form-section-title">Informasi Akun</h3>
                <div className="form-group">
                    <label htmlFor="password">Password <span className="required-asterisk">*</span></label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={`form-control ${errors.password ? 'is-invalid' : ''}`} />
                    {errors.password && <div className="invalid-feedback">{typeof errors.password === 'string' ? errors.password : errors.password[0]}</div>}
                </div>
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><span className="spinner-btn"></span> Menyimpan...</> : <><Icon name="save" /> Simpan Pengguna</>}
          </button>
          <Link to="/admin/users" className="btn btn-outline-secondary" disabled={isSubmitting}>
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
};
export default AddUserAdmin;