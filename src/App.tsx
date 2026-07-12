import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Absen from "./pages/Absen";
import Riwayat from "./pages/Riwayat";
import Cuti from "./pages/Cuti";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPegawai from "./pages/AdminPegawai";
import AdminAbsensi from "./pages/AdminAbsensi";
import AdminCuti from "./pages/AdminCuti";
import AdminExport from "./pages/AdminExport";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/absen" replace />;
  }

  return <>{children}</>;
}

function PegawaiRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/absen"
        element={
          <PegawaiRoute>
            <Absen />
          </PegawaiRoute>
        }
      />
      <Route
        path="/riwayat"
        element={
          <PegawaiRoute>
            <Riwayat />
          </PegawaiRoute>
        }
      />
      <Route
        path="/cuti"
        element={
          <PegawaiRoute>
            <Cuti />
          </PegawaiRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/pegawai"
        element={
          <AdminRoute>
            <AdminPegawai />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/absensi"
        element={
          <AdminRoute>
            <AdminAbsensi />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/cuti"
        element={
          <AdminRoute>
            <AdminCuti />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/export"
        element={
          <AdminRoute>
            <AdminExport />
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
