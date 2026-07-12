import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  LogOut,
  Calendar,
  Clock,
  User,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SHIFTS = [
  { value: "pagi", label: "Pagi (08:00 - 14:00)" },
  { value: "siang", label: "Siang (14:00 - 21:00)" },
  { value: "malam", label: "Malam (21:00 - 08:00)" },
  { value: "pagi+siang", label: "Pagi + Siang (08:00 - 21:00)" },
  { value: "siang+malam", label: "Siang + Malam (14:00 - 08:00)" },
  { value: "malam+pagi", label: "Malam + Pagi (21:00 - 14:00)" },
];

export default function Absen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const utils = trpc.useUtils();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [shift, setShift] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Fetch today's attendance
  const { data: todayAbsen, isLoading } = trpc.absensi.getToday.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const checkInMutation = trpc.absensi.checkIn.useMutation({
    onSuccess: () => {
      utils.absensi.getToday.invalidate();
      setSuccess("Absen masuk berhasil!");
      setFoto(null);
      setShift("");
      stopCamera();
    },
    onError: (err) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  const checkOutMutation = trpc.absensi.checkOut.useMutation({
    onSuccess: () => {
      utils.absensi.getToday.invalidate();
      setSuccess("Absen keluar berhasil!");
      setFoto(null);
      stopCamera();
    },
    onError: (err) => {
      setError(err.message);
      setIsProcessing(false);
    },
  });

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCameraActive(true);
      // Removed the synchronous assignment to videoRef.current here, we will use a callback ref instead
    } catch (err) {
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  // Callback ref for the video element to attach stream when it mounts
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    (videoRef as any).current = node; // Keep existing videoRef logic working for captureFoto
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  const captureFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setFoto(imageData);
    stopCamera();
  }, [stopCamera]);

  const handleCheckIn = async () => {
    setError("");
    setSuccess("");

    if (!shift) {
      setError("Pilih shift terlebih dahulu");
      return;
    }
    if (!foto) {
      setError("Ambil foto terlebih dahulu");
      return;
    }

    setIsProcessing(true);
      checkInMutation.mutate({
        shift: shift as "pagi" | "siang" | "malam" | "pagi+siang" | "siang+malam" | "malam+pagi",
        fotoMasuk: foto,
      });
  };

  const handleCheckOut = async () => {
    setError("");
    setSuccess("");

    if (!foto) {
      setError("Ambil foto terlebih dahulu");
      return;
    }

    setIsProcessing(true);
      checkOutMutation.mutate({
        fotoKeluar: foto,
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hadir": return "bg-green-100 text-green-800 border-green-300";
      case "terlambat": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "izin": return "bg-blue-100 text-blue-800 border-blue-300";
      case "sakit": return "bg-purple-100 text-purple-800 border-purple-300";
      case "alpha": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = () => {
    if (!todayAbsen) return "Belum Absen";
    if (todayAbsen.jamKeluar) return "Selesai";
    if (todayAbsen.jamMasuk) return "Sudah Masuk";
    return "Belum Absen";
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">{user.nama}</h1>
              <p className="text-xs text-teal-100">{user.jabatan}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Clock Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-600 to-cyan-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-teal-200" />
              <span className="text-sm text-teal-100">
                {currentTime.toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-teal-200" />
              <span className="text-4xl font-bold tabular-nums">
                {currentTime.toLocaleTimeString("id-ID")}
              </span>
            </div>
            <div className="mt-4">
              <Badge className={`${getStatusColor(todayAbsen?.status || "")} text-xs px-3 py-1`}>
                {getStatusText()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Details */}
        {todayAbsen && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm text-gray-700 mb-3">Detail Absensi Hari Ini</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Jam Masuk</p>
                  <p className="font-semibold text-sm">
                    {todayAbsen.jamMasuk
                      ? new Date(todayAbsen.jamMasuk).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Jam Keluar</p>
                  <p className="font-semibold text-sm">
                    {todayAbsen.jamKeluar
                      ? new Date(todayAbsen.jamKeluar).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                      : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Shift</p>
                  <p className="font-semibold text-sm capitalize">{todayAbsen.shift}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-semibold text-sm capitalize">{todayAbsen.status}</p>
                  {todayAbsen.keterangan && (
                    <p className="text-xs text-gray-500 mt-1">{todayAbsen.keterangan}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-green-50 border-green-300 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Check In Form */}
        {(!todayAbsen || todayAbsen.jamKeluar) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                Absen Masuk
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Pilih Shift</label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih shift kerja" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Camera */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Foto Wajah</label>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[4/3]">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoCallbackRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <Button
                          onClick={captureFoto}
                          className="bg-white text-gray-900 hover:bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      </div>
                    </>
                  ) : foto ? (
                    <img src={foto} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Ambil foto untuk bukti absensi</p>
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        className="mt-3 border-gray-500 text-gray-300 hover:bg-gray-800"
                      >
                        Buka Kamera
                      </Button>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                {foto && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFoto(null);
                        startCamera();
                      }}
                      className="flex-1"
                    >
                      Ulangi Foto
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCheckIn}
                disabled={isProcessing || !shift || !foto}
                className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Absen Masuk"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Check Out Form */}
        {todayAbsen?.jamMasuk && !todayAbsen?.jamKeluar && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                Absen Keluar
              </h3>

              {/* Camera */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Foto Wajah</label>
                <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[4/3]">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoCallbackRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <Button
                          onClick={captureFoto}
                          className="bg-white text-gray-900 hover:bg-gray-100 rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      </div>
                    </>
                  ) : foto ? (
                    <img src={foto} alt="Captured" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Camera className="w-12 h-12 mb-2" />
                      <p className="text-sm">Ambil foto untuk bukti absen keluar</p>
                      <Button
                        onClick={startCamera}
                        variant="outline"
                        className="mt-3 border-gray-500 text-gray-300 hover:bg-gray-800"
                      >
                        Buka Kamera
                      </Button>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />

                {foto && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFoto(null);
                      startCamera();
                    }}
                    className="w-full"
                  >
                    Ulangi Foto
                  </Button>
                )}
              </div>

              <Button
                onClick={handleCheckOut}
                disabled={isProcessing || !foto}
                className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Absen Keluar"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Completed Message */}
        {todayAbsen?.jamKeluar && (
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-800">Sesi Absensi Selesai</h3>
              <p className="text-sm text-green-600 mt-1 mb-4">
                Anda sudah melakukan absen masuk dan keluar.
              </p>
              <Button
                variant="outline"
                className="w-full border-green-600 text-green-700 hover:bg-green-100"
                onClick={() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
              >
                Mulai Shift Baru
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Separator className="my-2" />
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-12 justify-between text-left"
            onClick={() => navigate("/riwayat")}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Riwayat Absensi
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 justify-between text-left"
            onClick={() => navigate("/cuti")}
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Pengajuan Cuti
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
      </main>
    </div>
  );
}
