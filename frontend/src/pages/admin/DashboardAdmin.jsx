import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/admin/dashboard.css";

const DashboardAdmin = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProduk: 0,
    totalOrder: 0,
    totalUser: 0,
    pendapatanBulanan: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const navigate = useNavigate();

  const loadChartJS = () => {
    return new Promise((resolve, reject) => {
      if (window.Chart) return resolve(window.Chart);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.async = true;
      script.onload = () => window.Chart ? resolve(window.Chart) : reject(new Error("Gagal memuat Chart.js"));
      script.onerror = () => reject(new Error("Gagal memuat Chart.js"));
      document.body.appendChild(script);
    });
  };

  const loadSweetAlert = () => {
    return new Promise((resolve, reject) => {
      if (window.Swal) return resolve(window.Swal);
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
      script.async = true;
      script.onload = () => window.Swal ? resolve(window.Swal) : reject(new Error("Gagal memuat SweetAlert2"));
      script.onerror = () => reject(new Error("Gagal memuat SweetAlert2"));
      document.body.appendChild(script);
    });
  };

  const fetchData = async () => {
    try {
      const userResponse = await api.get("/profile");
      const currentUser = userResponse.data.data;
      if (currentUser.role !== "admin") {
        navigate("/dashboard");
        return;
      }
      setUser(currentUser);

      const productsResponse = await api.get("/products");
      const totalProduk = productsResponse.data.data.length;

      const ordersResponse = await api.get("/admin/orders");
      const totalOrder = ordersResponse.data.data.length;

      const usersResponse = await api.get("/users/count");
      const totalUser = usersResponse.data.data;

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const pendapatanBulanan = ordersResponse.data.data
        .filter(order => order.status === 'paid' && new Date(order.created_at).getMonth() + 1 === currentMonth && new Date(order.created_at).getFullYear() === currentYear)
        .reduce((sum, order) => sum + order.total, 0);

      const recent = ordersResponse.data.data.slice(0, 5);

      const productSales = {};
      ordersResponse.data.data.forEach(order => {
        order.items.forEach(item => {
          productSales[item.product_id] = productSales[item.product_id] || { name: item.product.name_product, sold: 0 };
          productSales[item.product_id].sold += item.quantity;
        });
      });
      const popular = Object.values(productSales)
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      const salesByMonth = {};
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni"];
      for (let i = 0; i < 6; i++) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
        salesByMonth[monthKey] = 0;
      }
      ordersResponse.data.data.forEach(order => {
        if (order.status === 'paid') {
          const date = new Date(order.created_at);
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (salesByMonth[monthKey] !== undefined) {
            salesByMonth[monthKey] += order.total;
          }
        }
      });
      const salesChartData = months.map((month, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - index));
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        return salesByMonth[monthKey] / 1000000;
      });

      setStats({ totalProduk, totalOrder, totalUser, pendapatanBulanan });
      setRecentOrders(recent);
      setPopularProducts(popular);
      setSalesData(salesChartData);

      const hasShownPopup = localStorage.getItem("hasShownLoginPopup");
      if (!hasShownPopup) {
        await loadSweetAlert().then(Swal => {
          Swal.fire({
            icon: "success",
            title: "Selamat!",
            text: `Selamat Datang, ${currentUser.nama || "Admin"}!`,
            confirmButtonText: "OK",
            confirmButtonColor: "#4F46E5",
          });
        });
        localStorage.setItem("hasShownLoginPopup", "true");
      }

      setLoading(false);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (!loading) {
      loadChartJS().then(() => {
        const ctx = document.getElementById("salesChart");
        if (ctx) {
          new window.Chart(ctx, {
            type: "line",
            data: {
              labels: ["Januari", "Februari", "Maret", "April", "Mei", "Juni"],
              datasets: [{
                label: "Penjualan Bulanan (Rp juta)",
                data: salesData,
                backgroundColor: "rgba(79, 70, 229, 0.2)",
                borderColor: "rgba(79, 70, 229, 1)",
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: "#FFFFFF",
                pointBorderColor: "#4F46E5",
                pointBorderWidth: 2,
                fill: true,
              }],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    boxWidth: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    font: {
                      family: "'Poppins', sans-serif",
                      size: 12,
                      weight: '500'
                    }
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(17, 24, 39, 0.8)',
                  padding: 12,
                  titleFont: {
                    family: "'Poppins', sans-serif",
                    size: 14,
                    weight: '600'
                  },
                  bodyFont: {
                    family: "'Poppins', sans-serif",
                    size: 12
                  },
                  callbacks: {
                    label: function(context) {
                      return `Penjualan: Rp ${context.raw.toFixed(2)} juta`;
                    }
                  }
                }
              },
              scales: {
                y: { 
                  beginAtZero: true, 
                  grid: {
                    drawBorder: false,
                    color: 'rgba(229, 231, 235, 0.5)'
                  },
                  ticks: {
                    font: {
                      family: "'Poppins', sans-serif",
                      size: 11
                    }
                  },
                  title: { 
                    display: true, 
                    text: "Pendapatan (Rp Juta)",
                    font: {
                      family: "'Poppins', sans-serif",
                      size: 12,
                      weight: '500'
                    }
                  } 
                },
                x: { 
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: {
                      family: "'Poppins', sans-serif",
                      size: 11
                    }
                  },
                  title: { 
                    display: true, 
                    text: "Bulan",
                    font: {
                      family: "'Poppins', sans-serif",
                      size: 12,
                      weight: '500'
                    } 
                  } 
                },
              },
            },
          });
        }
      });
    }
  }, [loading, salesData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Menunggu';
      case 'waiting_confirmation': return 'Konfirmasi';
      case 'paid': return 'Lunas'; 
      case 'failed': return 'Gagal';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const handleDownloadReport = async (format) => {
    const Swal = await loadSweetAlert();
    try {
      Swal.fire({
        title: `Mengunduh Laporan ${format.toUpperCase()}`,
        text: 'Harap tunggu sebentar, laporan sedang dibuat...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await api.get(`/admin/reports/sales/download/${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;

      // Map format ke ekstensi yang benar
      const extension = format === 'excel' ? 'xlsx' : format;
      
      let filename = `laporan-penjualan-${new Date().toISOString().slice(0,10)}.${extension}`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
          if (filenameMatch && filenameMatch.length === 2) {
            filename = filenameMatch[1];
          } else {
            const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (filenameStarMatch && filenameStarMatch.length === 2) {
                filename = decodeURIComponent(filenameStarMatch[1]);
            }
          }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      Swal.fire('Berhasil!', `Laporan ${format.toUpperCase()} telah berhasil diunduh.`, 'success');

    } catch (err) {
      console.error(`Gagal mengunduh laporan ${format}:`, err);
      Swal.fire('Gagal!', err.response?.data?.message || `Tidak dapat mengunduh laporan ${format.toUpperCase()}.`, 'error');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Memuat dashboard admin...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <div className="admin-header-info">
          <h2 className="admin-dashboard-title">Dashboard Admin</h2>
          <p className="admin-welcome-message">
            <span className="greeting">👋 Selamat datang, </span>
            <span className="admin-name">{user?.nama || "Admin"}</span>
          </p>
        </div>
        <div className="admin-date-info">
          <div className="date-badge">
            <i className="fas fa-calendar-alt"></i>
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="admin-stats-container">
        <div className="admin-stat-card">
          <div className="admin-stat-icon product-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="admin-stat-info">
            <h3>Total Produk</h3>
            <p className="admin-stat-value">{stats.totalProduk}</p>
            <div className="stat-progress">
              <div className="progress-bar product-progress" style={{ width: `${(stats.totalProduk / 200) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon order-icon">
            <i className="fas fa-shopping-cart"></i>
          </div>
          <div className="admin-stat-info">
            <h3>Total Order</h3>
            <p className="admin-stat-value">{stats.totalOrder}</p>
            <div className="stat-progress">
              <div className="progress-bar order-progress" style={{ width: `${(stats.totalOrder / 100) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon user-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="admin-stat-info">
            <h3>Total User</h3>
            <p className="admin-stat-value">{stats.totalUser}</p>
            <div className="stat-progress">
              <div className="progress-bar user-progress" style={{ width: `${(stats.totalUser / 500) * 100}%` }}></div>
            </div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon revenue-icon">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="admin-stat-info">
            <h3>Pendapatan Bulan Ini</h3>
            <p className="admin-stat-value">{formatCurrency(stats.pendapatanBulanan)}</p>
            <div className="stat-progress">
              <div className="progress-bar revenue-progress" style={{ width: `${Math.min((stats.pendapatanBulanan / 50000000) * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="admin-panel chart-panel">
          <div className="panel-header">
            <h3 className="admin-panel-title">
              <i className="fas fa-chart-line"></i>
              Grafik Penjualan 6 Bulan Terakhir
            </h3>
            <div className="panel-actions">
              <div className="report-actions">
                <button onClick={() => handleDownloadReport('pdf')} className="btn panel-action-btn btn-outline-danger">
                  <i className="fas fa-file-pdf"></i> PDF
                </button>
                <button onClick={() => handleDownloadReport('excel')} className="btn panel-action-btn btn-outline-success">
                  <i className="fas fa-file-excel"></i> Excel
                </button>
              </div>
            </div>
          </div>
          <div className="admin-panel-content chart-container">
            <canvas id="salesChart"></canvas>
          </div>
          <div className="chart-summary">
            <div className="summary-item">
              <span className="summary-label">Total Pendapatan:</span>
              <span className="summary-value">{formatCurrency(salesData.reduce((a, b) => a + b, 0) * 1000000)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Rata-rata Bulanan:</span>
              <span className="summary-value">{formatCurrency((salesData.reduce((a, b) => a + b, 0) / salesData.length) * 1000000)}</span>
            </div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-header">
            <h3 className="admin-panel-title">
              <i className="fas fa-star"></i>
              Produk Terpopuler
            </h3>
            <div className="panel-actions">
              <button className="panel-action-btn" onClick={() => navigate("/admin/products")}>
                <i className="fas fa-boxes"></i> Kelola Produk
              </button>
            </div>
          </div>
          <div className="admin-panel-content">
            {popularProducts.length > 0 ? (
              popularProducts.map((product, index) => (
                <div className="popular-product" key={index}>
                  <div className={`product-rank rank-${index + 1}`}>{index + 1}</div>
                  <div className="product-info">
                    <h4>{product.name}</h4>
                    <div className="product-stats">
                      <div className="stat-badge">
                        <i className="fas fa-shopping-cart"></i>
                        <span>Terjual: {product.sold} unit</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i>
                <p>Belum ada data produk populer</p>
              </div>
            )}
          </div>
        </div>

        <div className="admin-panel">
          <div className="panel-header">
            <h3 className="admin-panel-title">
              <i className="fas fa-clipboard-list"></i>
              Order Terbaru
            </h3>
            <div className="panel-actions">
              <button className="panel-action-btn" onClick={() => navigate("/admin/orders")}>
                <i className="fas fa-eye"></i> Lihat Semua
              </button>
            </div>
          </div>
          <div className="admin-panel-content">
            {recentOrders.length > 0 ? (
              <div className="orders-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Pelanggan</th>
                      <th>Produk</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="order-row">
                        <td className="order-id">#{order.id}</td>
                        <td className="customer-name">{order.user.nama}</td>
                        <td className="product-name">{order.items[0]?.product.name_product || "Beberapa Produk"}</td>
                        <td className="order-total">{formatCurrency(order.total)}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-data-message">
                <i className="fas fa-info-circle"></i>
                <p>Belum ada data order terbaru</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="admin-panel quick-actions-panel">
          <div className="panel-header">
            <h3 className="admin-panel-title">
              <i className="fas fa-bolt"></i>
              Aksi Cepat
            </h3>
          </div>
          <div className="admin-panel-content quick-actions-grid">
            <div className="quick-action-card" onClick={() => navigate("/admin/products/add")}>
              <i className="fas fa-plus-circle"></i>
              <span>Tambah Produk</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate("/admin/orders")}>
              <i className="fas fa-check-circle"></i>
              <span>Konfirmasi Order</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate("/admin/users")}>
              <i className="fas fa-user-plus"></i>
              <span>Kelola User</span>
            </div>
            <div className="quick-action-card" onClick={() => navigate("/admin/reports")}>
              <i className="fas fa-chart-bar"></i>
              <span>Lihat Laporan</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="admin-footer">
        <p>© {new Date().getFullYear()} Admin Dashboard. Semua hak dilindungi.</p>
        <div className="footer-links">
          <a href="/help">Bantuan</a>
          <a href="/privacy">Kebijakan Privasi</a>
          <a href="/terms">Syarat & Ketentuan</a>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;