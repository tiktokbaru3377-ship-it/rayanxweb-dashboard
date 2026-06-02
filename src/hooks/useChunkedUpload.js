import { useState } from 'react';
import api from '../services/api';

export const useChunkedUpload = () => {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const uploadBinaryInChunks = async (file, targetDeviceGroup = 'ALL') => {
    const CHUNK_SIZE = 1024 * 1024 * 2; // Batasi ukuran potongan berkas maksimal 2MB per segmen
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const fileChunk = file.slice(start, end);

        // Bungkus potongan biner ke dalam objek FormData
        const formData = new FormData();
        formData.append('chunk', fileChunk);
        formData.append('chunkIndex', chunkIndex);
        formData.append('totalChunks', totalChunks);
        formData.append('uploadId', uploadId);
        formData.append('filename', file.name);
        formData.append('targetGroup', targetDeviceGroup);

        // Transmisikan potongan biner ke kluster server penyimpanan
        await api.post('/storage/upload-chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Hitung persentase kemajuan unggahan secara linear
        const currentProgress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setProgress(currentProgress);
      }

      // Kirim sinyal komitmen akhir untuk merekonstruksi potongan berkas kembali menjadi file utuh di server
      await api.post('/storage/commit-upload', { uploadId, filename: file.name, totalChunks });
      setIsUploading(false);
      return true;

    } catch (err) {
      setError(err.message || 'Transmission pipeline broken.');
      setIsUploading(false);
      return false;
    }
  };

  return { uploadBinaryInChunks, progress, isUploading, error };
};
