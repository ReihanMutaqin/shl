import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const JENIS_CUTI = [
  { value: "tahunan", label: "Cuti Tahunan" },
  { value: "sakit", label: "Cuti Sakit" },
  { value: "melahirkan", label: "Cuti Melahirkan" },
  { value: "penting", label: "Cuti Penting" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  disetujui: "bg-green-100 text-green-800 border-green-300",
  ditolak: "bg-red-100 text-red-800 border-red-300",
};

export default function Cuti() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [jenis, setJenis] = useState("");
  const [alasan, setAlasan] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: riwayatCuti, isLoading } = trpc.cuti.getByPegawai.useQuery(
    { pegawaiId: user?.id },
    { enabled: !!user }
  );

  const createMutation = trpc.cuti.create.useMutation({
    onSuccess: () => {
      utils.cuti.getByPegawai.invalidate();
      setSuccess("Pengajuan cuti berhasil dikirim!");
      setTanggalMulai("");
      setTanggalSelesai("");
      setJenis("");
      setAlasan("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!tanggalMulai || !tanggalSelesai || !jenis || !alasan.trim()) {
      setError("Semua field wajib diisi");
      return;
    }

    if (new Date(tanggalMulai) > new Date(tanggalSelesai)) {
      setError("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
      return;
    }

    createMutation.mutate({
      tanggalMulai,
      tanggalSelesai,
      jenis: jenis as "tahunan" | "sakit" | "melahirkan" | "penting",
      alasan: alasan.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/absen")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Pengajuan Cuti</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Form */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Form Pengajuan Cuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-300 text-green-800 mb-4">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mulai">Tanggal Mulai</Label>
                  <Input
                    id="mulai"
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selesai">Tanggal Selesai</Label>
                  <Input
                    id="selesai"
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jenis Cuti</Label>
                <Select value={jenis} onValueChange={setJenis}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Pilih jenis cuti" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_CUTI.map((j) => (
                      <SelectItem key={j.value} value={j.value}>
                        {j.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alasan">Alasan Cuti</Label>
                <Textarea
                  id="alasan"
                  placeholder="Jelaskan alasan pengajuan cuti..."
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full h-11 bg-teal-600 hover:bg-teal-700"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mengirim...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Ajukan Cuti
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Riwayat */}
        <Separator />
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            Riwayat Pengajuan
          </h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : riwayatCuti && riwayatCuti.length > 0 ? (
            <div className="space-y-3">
              {riwayatCuti.map((c) => (
                <Card key={c.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium">
                            {new Date(c.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                            {new Date(c.tanggalSelesai).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 capitalize mb-2">
                          {c.jenis} — {c.alasan}
                        </p>
                      </div>
                      <Badge className={`${STATUS_COLORS[c.status]} text-xs capitalize`}>
                        {c.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada pengajuan cuti</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
