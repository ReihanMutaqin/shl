import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  User,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  disetujui: "bg-green-100 text-green-800 border-green-300",
  ditolak: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminCuti() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [filterStatus, setFilterStatus] = useState<string>("");
  const [success, setSuccess] = useState("");

  const { data: cutiList, isLoading } = trpc.cuti.getAll.useQuery(
    { status: filterStatus as "pending" | "disetujui" | "ditolak" | undefined },
    { refetchInterval: 30000 }
  );

  const approveMutation = trpc.cuti.approve.useMutation({
    onSuccess: () => {
      utils.cuti.getAll.invalidate();
      utils.cuti.stats.invalidate();
      setSuccess("Status cuti berhasil diupdate");
    },
  });

  const handleApprove = (id: number, status: "disetujui" | "ditolak") => {
    if (confirm(`Yakin ingin ${status === "disetujui" ? "menyetujui" : "menolak"} pengajuan cuti ini?`)) {
      approveMutation.mutate({ id, status });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Pengajuan Cuti</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        {success && (
          <Alert className="bg-green-50 border-green-300 text-green-800 mb-4">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { value: "", label: "Semua" },
            { value: "pending", label: "Pending" },
            { value: "disetujui", label: "Disetujui" },
            { value: "ditolak", label: "Ditolak" },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={filterStatus === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(tab.value)}
              className={
                filterStatus === tab.value
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : ""
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Cuti List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cutiList && cutiList.length > 0 ? (
          <div className="space-y-3">
            {cutiList.map((c) => (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-teal-600" />
                        <span className="font-semibold text-sm">{c.pegawai?.nama}</span>
                        <span className="text-xs text-gray-500">({c.pegawai?.idPegawai})</span>
                        <Badge className={`${STATUS_COLORS[c.status]} text-xs capitalize ml-auto`}>
                          {c.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {new Date(c.tanggalMulai).toLocaleDateString("id-ID")} -{" "}
                            {new Date(c.tanggalSelesai).toLocaleDateString("id-ID")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <ClipboardList className="w-3.5 h-3.5 text-gray-400" />
                          <span className="capitalize">{c.jenis}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5 mt-2">
                        {c.alasan}
                      </p>

                      {c.status !== "pending" && c.approvedAt && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.status === "disetujui" ? "Disetujui" : "Ditolak"} pada{" "}
                          {new Date(c.approvedAt).toLocaleDateString("id-ID")}
                          {c.approver && ` oleh ${c.approver.nama}`}
                        </p>
                      )}
                    </div>

                    {c.status === "pending" && (
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleApprove(c.id, "disetujui")}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Setuju
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleApprove(c.id, "ditolak")}
                          disabled={approveMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">Tidak ada pengajuan cuti</p>
          </div>
        )}
      </main>
    </div>
  );
}
