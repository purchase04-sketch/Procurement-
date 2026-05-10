import { Upload } from 'lucide-react';
import { useRef } from 'react';
import API from '../lib/api';
import { useAppContext } from '../App';

export default function ExcelUploader({ module, onSuccess }) {
  const fileRef = useRef();
  const { addToast } = useAppContext();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      addToast(`Uploading ${file.name}...`, 'info');
      const res = await API.post(`/upload/${module}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addToast(`✅ ${res.data.rows} rows processed (${res.data.inserted} new, ${res.data.updated} updated)`, 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      addToast(`❌ Upload failed: ${err.response?.data?.error || err.message}`, 'error');
    }
    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <label className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-dashed border-white/[0.15] rounded-xl px-4 py-2.5 cursor-pointer transition-all text-sm text-gray-300">
      <Upload size={16} />
      Upload Excel (.xlsx)
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleUpload} className="hidden" />
    </label>
  );
}
