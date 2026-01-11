import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import ProductList from "./pages/admin/Products/Index";
import AddProduct from "./pages/admin/Products/Add";
import EditProduct from "./pages/admin/Products/Edit";
import DetailProduct from "./pages/admin/Products/Detail"; 
import AdminOrdersList from "./pages/admin/Orders/Orders";
import AdminOrderDetail from "./pages/admin/Orders/OrdersDetail";
import UserList from "./pages/admin/Users/UserList";
import AddUserAdmin from "./pages/admin/Users/AddUser"; 
import EditUserAdmin from "./pages/admin/Users/EditUser";
import UserDetailAdmin from "./pages/admin/Users/DetailUser";
import ReportsPage from "./pages/admin/Reports/Reports"; 

import DashboardCustomer from "./pages/customer/DashboardCustomer";
import CustomerProducts from "./pages/customer/CustomerProducts";
import Cart from "./pages/customer/cart/Cart";
import Orders from "./pages/customer/orders/Orders";
import ProductDetail from "./pages/customer/ProductDetail";
import Checkout from "./pages/customer/orders/Checkout";
import Profile from "./pages/customer/profile/Profile";

import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar"; 
import api from "./services/api";

// Komponen Dashboard untuk mengarahkan user berdasarkan role
function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/profile");
        const currentUser = response.data.data;
        setUser(currentUser);

        if (currentUser.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/customer/dashboard");
        }
      } catch (error) {
        console.error("Gagal mengambil data pengguna:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Mengarahkan...</p>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Redirect from root (/) to /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard route yang akan redirect ke dashboard yang sesuai */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Route Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute role="admin">
              <DashboardAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <PrivateRoute role="admin">
              <ProductList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products/add"
          element={
            <PrivateRoute role="admin">
              <AddProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products/detail/:id"
          element={
            <PrivateRoute role="admin">
              <DetailProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/products/edit/:id"
          element={
            <PrivateRoute role="admin">
              <EditProduct />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <PrivateRoute role="admin">
              <AdminOrdersList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/orders/:orderId" 
          element={
            <PrivateRoute role="admin">
              <AdminOrderDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <PrivateRoute role="admin">
              <UserList />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/add"
          element={
            <PrivateRoute role="admin">
              <AddUserAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/detail/:userId" 
          element={
            <PrivateRoute role="admin">
              <UserDetailAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/users/edit/:userId" 
          element={
            <PrivateRoute role="admin">
              <EditUserAdmin />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <PrivateRoute role="admin">
              <ReportsPage />
            </PrivateRoute>
          }
        />


        {/* Route Customer */}
        <Route
          path="/customer/dashboard"
          element={
            <PrivateRoute role="user">
              <DashboardCustomer />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/products"
          element={
            <PrivateRoute role="user">
              <CustomerProducts />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/product/detail/:id"
          element={
            <PrivateRoute role="user">
              <ProductDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/cart"
          element={
            <PrivateRoute role="user">
              <Cart />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/orders"
          element={
            <PrivateRoute role="user">
              <Orders />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/orders/checkout"
          element={
            <PrivateRoute role="user">
              <Checkout />
            </PrivateRoute>
          }
        />
        <Route
          path="/customer/profile"
          element={
            <PrivateRoute role="user">
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;