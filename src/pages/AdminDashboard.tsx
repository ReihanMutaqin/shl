import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  UserX,
  ClipboardList,
  LogOut,
  TrendingUp,
  Calendar,
  ChevronRight,
  Clock,
  Hospital,
  Menu,
  X,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#0d9488", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: stats } = trpc.absensi.getStats.useQuery({
    bulan: currentMonth,
    tahun: currentYear,
  });

  const { data: pegawaiStats } = trpc.pegawai.stats.useQuery();

  const { data: todayAbsen } = trpc.absensi.todayOverview.useQuery();

  const { data: cutiStats } = trpc.cuti.stats.useQuery();

  const pieData = stats
    ? [
        { name: "Hadir", value: stats.hadir },
        { name: "Terlambat", value: stats.terlambat },
        { name: "Izin", value: stats.izin },
        { name: "Sakit", value: stats.sakit },
        { name: "Alpha", value: stats.alpha },
      ].filter((d) => d.value > 0)
    : [];

  const menuItems = [
    { label: "Dashboard", value: "overview", icon: TrendingUp, href: "/admin" },
    { label: "Pegawai", value: "pegawai", icon: Users, href: "/admin/pegawai" },
    { label: "Absensi", value: "absensi", icon: Calendar, href: "/admin/absensi" },
    { label: "Cuti", value: "cuti", icon: ClipboardList, href: "/admin/cuti" },
    { label: "Export", value: "export", icon: TrendingUp, href: "/admin/export" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hadir": return "bg-green-100 text-green-800";
      case "terlambat": return "bg-yellow-100 text-yellow-800";
      case "izin": return "bg-blue-100 text-blue-800";
      case "sakit": return "bg-purple-100 text-purple-800";
      case "alpha": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-20 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <h1 className="font-semibold">Admin RS SHL</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-20 flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">RS SHL</h2>
              <p className="text-xs text-gray-500">Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                navigate(item.href);
                setActiveTab(item.value);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.value
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.nama}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-2 text-sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <Hospital className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">RS SHL</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                navigate(item.href);
                setActiveTab(item.value);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === item.value
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nama}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Pegawai</p>
                  <p className="text-2xl font-bold text-gray-900">{pegawaiStats?.totalPegawai || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Hadir Hari Ini</p>
                  <p className="text-2xl font-bold text-green-600">
                    {todayAbsen?.filter((a) => a.status === "hadir").length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Cuti Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{cutiStats?.pending || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Alpha</p>
                  <p className="text-2xl font-bold text-red-600">{stats?.alpha || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <UserX className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Distribusi Kehadiran Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    Belum ada data
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Ringkasan Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Hadir", value: stats?.hadir || 0, color: "bg-green-500" },
                  { label: "Terlambat", value: stats?.terlambat || 0, color: "bg-yellow-500" },
                  { label: "Izin", value: stats?.izin || 0, color: "bg-blue-500" },
                  { label: "Sakit", value: stats?.sakit || 0, color: "bg-purple-500" },
                  { label: "Alpha", value: stats?.alpha || 0, color: "bg-red-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm flex-1">{item.label}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Kehadiran</span>
                <span className="text-lg font-bold text-teal-600">
                  {(stats?.hadir || 0) +
                    (stats?.terlambat || 0) +
                    (stats?.izin || 0) +
                    (stats?.sakit || 0) +
                    (stats?.alpha || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Attendance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Absensi Hari Ini
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-600"
                onClick={() => navigate("/admin/absensi")}
              >
                Lihat Semua
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayAbsen && todayAbsen.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium">Shift</th>
                      <th className="pb-3 pr-4 font-medium">Jam Masuk</th>
                      <th className="pb-3 pr-4 font-medium">Jam Keluar</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayAbsen.slice(0, 10).map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{a.pegawai?.nama}</td>
                        <td className="py-3 pr-4 capitalize">{a.shift}</td>
                        <td className="py-3 pr-4">
                          {a.jamMasuk
                            ? new Date(a.jamMasuk).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 pr-4">
                          {a.jamKeluar
                            ? new Date(a.jamKeluar).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3">
                          <Badge className={`${getStatusColor(a.status)} text-xs capitalize`}>
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">
                Belum ada absensi hari ini
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
