import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "/src/services/api.js";
import "/src/styles/admin/reports/reports.css";

const Icon = ({ name, className }) => <i className={`fas fa-${name} ${className || ''}`}></i>;

const ReportsPage = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salesChartInstance, setSalesChartInstance] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('last6months');

  const navigate = useNavigate();

  const loadChartJS = () => new Promise((resolve, reject) => {
    if (window.Chart) return resolve(window.Chart);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.async = true;
    script.onload = () => window.Chart ? resolve(window.Chart) : reject(new Error("Gagal memuat Chart.js"));
    script.onerror = () => reject(new Error("Gagal memuat Chart.js dari CDN"));
    document.body.appendChild(script);
  });

  const loadSweetAlert = () => new Promise((resolve, reject) => {
    if (window.Swal) return resolve(window.Swal);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.async = true;
    script.onload = () => window.Swal ? resolve(window.Swal) : reject(new Error("Gagal memuat SweetAlert2"));
    script.onerror = () => reject(new Error("Gagal memuat SweetAlert2 dari CDN"));
    document.body.appendChild(script);
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ordersRes, productsRes, usersCountRes] = await Promise.all([
          api.get("/admin/orders"),
          api.get("/products"),
          api.get("/users/count")
        ]);
        setOrders(ordersRes.data.data || []);
        setProducts(productsRes.data.data || []);
        setUsersCount(usersCountRes.data.data || 0);
      } catch (err) {
        console.error("Gagal mengambil data untuk laporan:", err);
        setError(err.response?.data?.message || "Terjadi kesalahan saat memuat data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const salesReportData = useMemo(() => {
    if (!orders.length) return { labels: [], data: [], totalRevenue: 0, totalOrders: 0 };

    const paidOrders = orders.filter(order => order.status === 'paid');
    const monthlySales = {};
    const MONTH_NAMES_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; 
      const monthLabel = `${MONTH_NAMES_ID[date.getMonth()]} ${date.getFullYear()}`;
      monthlySales[monthKey] = { sales: 0, count: 0, label: monthLabel };
    }
    
    paidOrders.forEach(order => {
      const orderDate = new Date(order.payment_date || order.created_at);
      const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlySales[monthKey]) {
        monthlySales[monthKey].sales += order.total;
        monthlySales[monthKey].count += 1;
      }
    });

    const sortedMonthKeys = Object.keys(monthlySales).sort();
    const labels = sortedMonthKeys.map(key => monthlySales[key].label);
    const data = sortedMonthKeys.map(key => monthlySales[key].sales);
    
    const totalRevenue = data.reduce((sum, current) => sum + current, 0);
    const totalOrders = paidOrders.length;

    return { labels, data, totalRevenue, totalOrders, monthlySalesData: monthlySales };
  }, [orders, selectedPeriod]);

  const productPerformanceReport = useMemo(() => {
    if (!orders.length || !products.length) return [];
    const salesCount = {};
    orders.forEach(order => {
      if (order.status === 'paid' && order.items) {
        order.items.forEach(item => {
          salesCount[item.product_id] = (salesCount[item.product_id] || 0) + item.quantity;
        });
      }
    });
    return products.map(p => ({
      ...p,
      units_sold: salesCount[p.id] || 0
    })).sort((a,b) => b.units_sold - a.units_sold).slice(0,10);
  }, [orders, products]);

  useEffect(() => {
    if (loading || !salesReportData.labels.length) return;

    loadChartJS().then(Chart => {
      if (salesChartInstance) {
        salesChartInstance.destroy();
      }
      const ctx = document.getElementById("salesReportChart");
      if (ctx) {
        const newChart = new Chart(ctx, {
          type: "bar",
          data: {
            labels: salesReportData.labels,
            datasets: [{
              label: "Total Penjualan (Rp)",
              data: salesReportData.data,
              backgroundColor: 'rgba(99, 102, 241, 0.6)',
              borderColor: 'rgba(99, 102, 241, 1)',
              borderWidth: 1,
              borderRadius: 6,
              hoverBackgroundColor: 'rgba(79, 70, 229, 0.8)',
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, ticks: { callback: value => `Rp ${value/1000}k` } },
              x: { grid: { display: false } }
            },
            animation: {
              duration: 1000,
              easing: 'easeInOutQuart'
            }
          },
        });
        setSalesChartInstance(newChart);
      }
    }).catch(err => console.error("ChartJS loading error:", err));
    
    return () => {
      if (salesChartInstance) {
        salesChartInstance.destroy();
      }
    };
  }, [loading, salesReportData]);

  const formatCurrency = (amount) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

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

  if (loading && !orders.length && !products.length) {
    return (
      <div className="admin-page-container">
        <div className="loading-fullscreen"><div className="spinner"></div><p>Memuat Data Laporan...</p></div>
      </div>
    );
  }

  return (
    <div className="admin-page-container admin-reports-page">
      <nav aria-label="breadcrumb" className="admin-breadcrumb">
        <ol>
          <li><Link to="/admin/dashboard">Admin</Link></li>
          <li aria-current="page">Laporan</li>
        </ol>
      </nav>

      <header className="admin-content-header reports-header">
        <h1><Icon name="chart-pie" className="header-icon"/>Pusat Laporan</h1>
        <p className="page-subtitle">Analisis performa toko Anda melalui berbagai laporan.</p>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}

      <section className="report-section card summary-cards-grid">
          <div className="summary-card animated-card">
            <Icon name="money-bill-wave" className="summary-icon revenue"/>
            <h4>Total Pendapatan</h4>
            <p>{formatCurrency(salesReportData.totalRevenue)}</p>
          </div>
          <div className="summary-card animated-card" style={{animationDelay: '0.1s'}}>
            <Icon name="shopping-cart" className="summary-icon orders"/>
            <h4>Total Pesanan (Lunas)</h4>
            <p>{salesReportData.totalOrders} Pesanan</p>
          </div>
          <div className="summary-card animated-card" style={{animationDelay: '0.2s'}}>
            <Icon name="box-open" className="summary-icon products"/>
            <h4>Total Produk</h4>
            <p>{products.length} Produk</p>
          </div>
           <div className="summary-card animated-card" style={{animationDelay: '0.3s'}}>
            <Icon name="users" className="summary-icon users"/>
            <h4>Total Pengguna</h4>
            <p>{usersCount} Pengguna</p>
          </div>
      </section>

      <section className="report-section card animated-card" style={{animationDelay: '0.2s'}}>
        <div className="card-header report-card-header">
          <h3><Icon name="chart-bar"/>Laporan Penjualan Bulanan (6 Bulan Terakhir)</h3>
          <div className="report-actions">
            <button onClick={() => handleDownloadReport('pdf')} className="btn btn-outline-danger">
                <Icon name="file-pdf"/> Unduh PDF
            </button>
            <button onClick={() => handleDownloadReport('excel')} className="btn btn-outline-success">
                <Icon name="file-excel"/> Unduh Excel
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="report-chart-container">
            <canvas id="salesReportChart"></canvas>
          </div>
        </div>
      </section>

      <section className="report-section card animated-card" style={{animationDelay: '0.3s'}}>
        <div className="card-header report-card-header">
          <h3><Icon name="award"/>Produk Terpopuler (Top 10)</h3>
        </div>
        <div className="card-body table-responsive-reports">
          {productPerformanceReport.length > 0 ? (
            <table className="admin-table report-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Produk</th>
                  <th className="text-right">Unit Terjual</th>
                  <th className="text-right">Stok Saat Ini</th>
                </tr>
              </thead>
              <tbody>
                {productPerformanceReport.map((product, index) => (
                  <tr key={product.id}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/admin/products/detail/${product.id}`}>{product.name_product}</Link>
                    </td>
                    <td className="text-right">{product.units_sold}</td>
                    <td className="text-right">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data-message">Data produk populer tidak tersedia.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;