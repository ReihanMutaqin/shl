import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Calendar,
  Table2,
  CheckCircle2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

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

export default function AdminExport() {
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [success, setSuccess] = useState("");

  const { data: absensiList, isLoading } = trpc.absensi.getAll.useQuery({
    bulan,
    tahun,
  });

  const { data: stats } = trpc.absensi.getStats.useQuery({ bulan, tahun });



  const filteredData = useMemo(() => {
    return absensiList?.filter((a) => !a.pegawai?.isHidden) || [];
  }, [absensiList]);

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

  const exportToExcel = () => {
    if (!filteredData.length) return;

    // Sheet 1: Ringkasan
    const ringkasanData = [
      ["RS SHL - LAPORAN ABSENSI"],
      [`Periode: ${BULAN.find((b) => b.value === bulan)?.label} ${tahun}`],
      [""],
      ["RINGKASAN"],
      ["Keterangan", "Jumlah"],
      ["Total Pegawai", stats?.totalPegawai || 0],
      ["Hadir", stats?.hadir || 0],
      ["Terlambat", stats?.terlambat || 0],
      ["Izin", stats?.izin || 0],
      ["Sakit", stats?.sakit || 0],
      ["Alpha", stats?.alpha || 0],
      ["Total Kehadiran",
        (stats?.hadir || 0) +
        (stats?.terlambat || 0) +
        (stats?.izin || 0) +
        (stats?.sakit || 0) +
        (stats?.alpha || 0)],
    ];

    const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData);

    // Sheet 2: Detail Absensi
    const detailHeaders = [
      "No",
      "ID Pegawai",
      "Nama",
      "Jabatan",
      "Departemen",
      "Tanggal",
      "Shift",
      "Jam Masuk",
      "Jam Keluar",
      "Status",
      "Keterangan",
    ];

    const detailData = filteredData.map((a, i) => [
      i + 1,
      a.pegawai?.idPegawai || "",
      a.pegawai?.nama || "",
      a.pegawai?.jabatan || "",
      a.pegawai?.departemen || "",
      new Date(a.tanggal).toLocaleDateString("id-ID"),
      a.shift,
      a.jamMasuk
        ? new Date(a.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
      a.jamKeluar
        ? new Date(a.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        : "-",
      a.status.toUpperCase(),
      a.keterangan || "-",
    ]);

    const wsDetail = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailData]);

    // Styling
    wsRingkasan["!cols"] = [
      { wch: 30 },
      { wch: 15 },
    ];

    wsDetail["!cols"] = [
      { wch: 5 },
      { wch: 12 },
      { wch: 20 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Absensi");

    // Download
    const bulanNama = BULAN.find((b) => b.value === bulan)?.label || String(bulan);
    XLSX.writeFile(wb, `Absensi_RS_SHL_${bulanNama}_${tahun}.xlsx`);

    setSuccess(`File Absensi_RS_SHL_${bulanNama}_${tahun}.xlsx berhasil diunduh!`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Export Data</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {success && (
          <Alert className="bg-green-50 border-green-300 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filter Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              Pilih Periode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs mb-1 block">Bulan</Label>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
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
                  className="h-10"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={exportToExcel}
                  disabled={!filteredData.length}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Table2 className="w-4 h-4 text-teal-600" />
              Preview Data — {BULAN.find((b) => b.value === bulan)?.label} {tahun}
              <span className="text-xs font-normal text-gray-500 ml-auto">
                {filteredData.length} records
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">No</th>
                      <th className="pb-3 pr-4 font-medium">ID Pegawai</th>
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jabatan</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">Departemen</th>
                      <th className="pb-3 pr-4 font-medium">Tanggal</th>
                      <th className="pb-3 pr-4 font-medium">Shift</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jam Masuk</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jam Keluar</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 50).map((a, i) => (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                        <td className="py-3 pr-4 font-mono text-xs">{a.pegawai?.idPegawai}</td>
                        <td className="py-3 pr-4 font-medium">{a.pegawai?.nama}</td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-gray-600">{a.pegawai?.jabatan}</td>
                        <td className="py-3 pr-4 hidden md:table-cell text-gray-600">{a.pegawai?.departemen}</td>
                        <td className="py-3 pr-4">
                          {new Date(a.tanggal).toLocaleDateString("id-ID")}
                        </td>
                        <td className="py-3 pr-4 capitalize">{a.shift}</td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {a.jamMasuk
                            ? new Date(a.jamMasuk).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 pr-4 hidden sm:table-cell">
                          {a.jamKeluar
                            ? new Date(a.jamKeluar).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(a.status)}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredData.length > 50 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Menampilkan 50 dari {filteredData.length} data. Download untuk melihat seluruh data.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada data untuk periode ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
