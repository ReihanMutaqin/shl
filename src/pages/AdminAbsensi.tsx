import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";

const BULAN = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export default function AdminAbsensi() {
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [departemen, setDepartemen] = useState("");
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const { data: absensiList, isLoading } = trpc.absensi.getAll.useQuery({
    bulan,
    tahun,
    departemen: departemen || undefined,
  });

  const { data: activePegawai } = trpc.pegawai.listActive.useQuery();

  const departemenList = [...new Set(activePegawai?.map((p) => p.departemen) || [])];

  const filteredAbsensi = absensiList?.filter((a) =>
    !a.pegawai?.isHidden &&
    (a.pegawai?.nama.toLowerCase().includes(search.toLowerCase()) ||
      a.pegawai?.idPegawai.toLowerCase().includes(search.toLowerCase()))
  );

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
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Monitoring Absensi</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        {/* Filter Card */}
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama/id pegawai..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilter(!showFilter)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            {showFilter && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t">
                <div>
                  <Label className="text-xs mb-1 block">Bulan</Label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(Number(e.target.value))}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {BULAN.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Tahun</Label>
                  <Input
                    type="number"
                    value={tahun}
                    onChange={(e) => setTahun(Number(e.target.value))}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Departemen</Label>
                  <select
                    value={departemen}
                    onChange={(e) => setDepartemen(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="">Semua</option>
                    {departemenList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              Data Absensi — {BULAN.find((b) => b.value === bulan)?.label} {tahun}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAbsensi && filteredAbsensi.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Tanggal</th>
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium">Shift</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jam Masuk</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jam Keluar</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAbsensi.map((a) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(a.tanggal).toLocaleDateString("id-ID")}
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-medium">{a.pegawai?.nama}</td>
                        <td className="py-3 pr-4 capitalize">{a.shift}</td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {a.jamMasuk ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {new Date(a.jamMasuk).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {a.jamKeluar ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {new Date(a.jamKeluar).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            "-"
                          )}
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
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada data absensi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
