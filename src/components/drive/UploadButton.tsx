import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";

interface UploadButtonProps {
  path?: string;
  disabled?: boolean;
}

export default function UploadButton({ path = "/", disabled }: UploadButtonProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path);
      formData.append("filename", file.name);
      await fetch("/api/drive/upload", { method: "POST", credentials: "include", body: formData });
      queryClient.invalidateQueries({ queryKey: ["drive"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading || disabled}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "上传中…" : "上传文件"}
      </button>
    </div>
  );
}
