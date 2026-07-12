import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDummy-RS-SHL-ReplaceWithRealKey",
  authDomain: "rs-shl-absensi.firebaseapp.com",
  projectId: "rs-shl-absensi",
  storageBucket: "rs-shl-absensi.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

export async function uploadFotoAbsen(
  pegawaiId: number,
  tanggal: string,
  tipe: "masuk" | "keluar",
  base64Image: string
): Promise<string> {
  const path = `absensi/${pegawaiId}/${tanggal}/${tipe}.jpg`;
  const storageRef = ref(storage, path);

  // Remove data:image/jpeg;base64, prefix if present
  const base64Data = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  await uploadString(storageRef, base64Data, "base64", {
    contentType: "image/jpeg",
  });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}
