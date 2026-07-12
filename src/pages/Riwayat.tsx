import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  ArrowLeft,
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

export default function Riwayat() {
  const navigate = useNavigate();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [bulan, setBulan] = useState(currentMonth);
  const [tahun, setTahun] = useState(currentYear);
  const [showFilter, setShowFilter] = useState(false);

  const { data: absensiList, isLoading } = trpc.absensi.getByPegawai.useQuery({
    bulan,
    tahun,
  });

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
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/absen")} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Riwayat Absensi</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filter Card */}
        <Card className="border-0 shadow-sm mb-4">
          <CardContent className="p-4">
            <Button
              variant="outline"
              onClick={() => setShowFilter(!showFilter)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilter ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </Button>

            {showFilter && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : absensiList && absensiList.length > 0 ? (
          <div className="space-y-3">
            {absensiList.map((a) => (
              <Card key={a.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-teal-700 font-semibold text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(a.tanggal).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </div>
                    <Badge className={`${getStatusColor(a.status)} text-xs capitalize`}>
                      {a.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="bg-gray-50 p-2 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">Jam Masuk</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-600" />
                        {a.jamMasuk ? new Date(a.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md">
                      <p className="text-xs text-gray-500 mb-1">Jam Keluar</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-600" />
                        {a.jamKeluar ? new Date(a.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                      </p>
                    </div>
                  </div>

                  {a.keterangan && (
                    <div className="text-xs text-red-500 mb-3 bg-red-50 p-2 rounded-md border border-red-100">
                      Info: {a.keterangan}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {a.fotoMasuk && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-8">Foto Masuk</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md w-[90%] rounded-lg">
                          <DialogHeader>
                            <DialogTitle>Foto Masuk</DialogTitle>
                          </DialogHeader>
                          <img src={a.fotoMasuk} alt="Foto Masuk" className="w-full rounded-md object-contain max-h-[70vh]" />
                        </DialogContent>
                      </Dialog>
                    )}
                    {a.fotoKeluar && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-8">Foto Keluar</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md w-[90%] rounded-lg">
                          <DialogHeader>
                            <DialogTitle>Foto Keluar</DialogTitle>
                          </DialogHeader>
                          <img src={a.fotoKeluar} alt="Foto Keluar" className="w-full rounded-md object-contain max-h-[70vh]" />
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada data absensi untuk bulan ini</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
