import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  Building2,
  Shield,
  UserCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminPegawai() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    idPegawai: "",
    nama: "",
    jabatan: "",
    departemen: "",
    password: "",
    role: "pegawai" as "pegawai" | "admin",
    isHidden: false,
  });

  const { data: pegawaiList, isLoading } = trpc.pegawai.list.useQuery();

  const createMutation = trpc.pegawai.create.useMutation({
    onSuccess: () => {
      utils.pegawai.list.invalidate();
      utils.pegawai.stats.invalidate();
      setSuccess("Pegawai berhasil ditambahkan");
      resetForm();
      setDialogOpen(false);
    },
    onError: (err) => setError(err.message),
  });

  const updateMutation = trpc.pegawai.update.useMutation({
    onSuccess: () => {
      utils.pegawai.list.invalidate();
      setSuccess("Pegawai berhasil diupdate");
      resetForm();
      setDialogOpen(false);
      setEditingId(null);
    },
    onError: (err) => setError(err.message),
  });

  const deleteMutation = trpc.pegawai.delete.useMutation({
    onSuccess: () => {
      utils.pegawai.list.invalidate();
      utils.pegawai.stats.invalidate();
      setSuccess("Pegawai berhasil dihapus");
    },
    onError: (err) => setError(err.message),
  });

  const resetForm = () => {
    setForm({
      idPegawai: "",
      nama: "",
      jabatan: "",
      departemen: "",
      password: "",
      role: "pegawai",
      isHidden: false,
    });
    setError("");
  };

  const handleEdit = (p: { id: number; idPegawai: string; nama: string; jabatan: string; departemen: string; role: string; isHidden: boolean }) => {
    setEditingId(p.id);
    setForm({
      idPegawai: p.idPegawai,
      nama: p.nama,
      jabatan: p.jabatan,
      departemen: p.departemen,
      password: "",
      role: p.role as "pegawai" | "admin",
      isHidden: p.isHidden,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.idPegawai.trim() || !form.nama.trim() || !form.jabatan.trim() || !form.departemen.trim()) {
      setError("Semua field wajib diisi");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...form,
        password: form.password || undefined,
      });
    } else {
      if (!form.password || form.password.length < 4) {
        setError("Password minimal 4 karakter");
        return;
      }
      createMutation.mutate(form);
    }
  };

  const filteredPegawai = pegawaiList?.filter((p) =>
    !p.isHidden &&
    (p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.idPegawai.toLowerCase().includes(search.toLowerCase()) ||
      p.departemen.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg">Manajemen Pegawai</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-300 text-green-800 mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                Daftar Pegawai
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari pegawai..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
                <Dialog
                  open={dialogOpen}
                  onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                      resetForm();
                      setEditingId(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Pegawai" : "Tambah Pegawai"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>ID Pegawai</Label>
                        <Input
                          value={form.idPegawai}
                          onChange={(e) => setForm({ ...form, idPegawai: e.target.value })}
                          placeholder="Contoh: P001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Lengkap</Label>
                        <Input
                          value={form.nama}
                          onChange={(e) => setForm({ ...form, nama: e.target.value })}
                          placeholder="Nama lengkap"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Jabatan</Label>
                          <Input
                            value={form.jabatan}
                            onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                            placeholder="Jabatan"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Departemen</Label>
                          <Input
                            value={form.departemen}
                            onChange={(e) => setForm({ ...form, departemen: e.target.value })}
                            placeholder="Departemen"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Password {editingId && "(kosongkan jika tidak diubah)"}</Label>
                        <Input
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          placeholder={editingId ? "••••••" : "Minimal 4 karakter"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={form.role}
                          onValueChange={(v) => setForm({ ...form, role: v as "pegawai" | "admin" })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pegawai">Pegawai</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-teal-600 hover:bg-teal-700"
                        disabled={createMutation.isPending || updateMutation.isPending}
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Menyimpan..."
                          : editingId
                          ? "Update"
                          : "Simpan"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPegawai && filteredPegawai.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-3 pr-4 font-medium">ID</th>
                      <th className="pb-3 pr-4 font-medium">Nama</th>
                      <th className="pb-3 pr-4 font-medium hidden sm:table-cell">Jabatan</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">Departemen</th>
                      <th className="pb-3 pr-4 font-medium">Role</th>
                      <th className="pb-3 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPegawai.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 pr-4 font-mono text-xs">{p.idPegawai}</td>
                        <td className="py-3 pr-4 font-medium">{p.nama}</td>
                        <td className="py-3 pr-4 hidden sm:table-cell text-gray-600">{p.jabatan}</td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            <Building2 className="w-3 h-3 mr-1" />
                            {p.departemen}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            className={
                              p.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }
                          >
                            {p.role === "admin" ? (
                              <span className="flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <UserCircle className="w-3 h-3" />
                                Pegawai
                              </span>
                            )}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(p)}
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (confirm("Yakin ingin menghapus pegawai ini?")) {
                                  deleteMutation.mutate({ id: p.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada pegawai</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
