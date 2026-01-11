import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await api.post("/login", formData);
            localStorage.setItem("token", response.data.token);

            // Ambil data user untuk menentukan role
            const userResponse = await api.get("/profile");
            const userRole = userResponse.data.data.role;

            // Redirect berdasarkan role
            if (userRole === "admin") {
                navigate("/admin/dashboard");
            } else {
                navigate("/customer/dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.errors || "Email atau password salah!");
            setIsSubmitting(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                setError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    return (
        <div className="login-page">
            <div className="wave-container">
                <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#6366f1" fillOpacity="1" d="M0,192L48,176C96,160,192,128,288,122.7C384,117,480,139,576,160C672,181,768,203,864,197.3C960,192,1056,160,1152,144C1248,128,1344,128,1392,128L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
                </svg>
            </div>
            
            <div className="login-container">
                <div className="login-header">
                    <div className="logo-badge">TO</div>
                    <h2 className="login-title">Halaman Login</h2>
                    <p className="login-subtitle">Masukkan kredensial Anda untuk melanjutkan</p>
                </div>
                
                {error && (
                    <div className="error-container">
                        <p className="error-title">Error</p>
                        <p>{typeof error === 'string' ? error : JSON.stringify(error)}</p>
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-group">
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                            </div>
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Masukkan Email Anda" 
                                onChange={handleChange} 
                                required 
                                className="form-input"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                            <div className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                placeholder="Masukkan Password Anda" 
                                onChange={handleChange} 
                                required 
                                className="form-input"
                                autoComplete="new-password"
                            />
                            <button 
                                type="button" 
                                onClick={togglePasswordVisibility}
                                className="password-toggle"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    
                    <div className="forgot-password">
                        <a href="#">Lupa Password?</a>
                    </div>
                    
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <span>Masuk Sekarang</span>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="button-icon">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                <div className="register-link">
                    <p>
                        Belum punya akun? <Link to="/register">Daftar Sekarang</Link>
                    </p>
                </div>
            </div>
            
            <div className="bottom-wave-container">
                <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                    <path fill="#6366f1" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,128C384,128,480,96,576,90.7C672,85,768,107,864,144C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>
    );
};

export default Login;