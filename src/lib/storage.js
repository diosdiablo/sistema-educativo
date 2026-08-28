import { supabase } from './supabase';

const BUCKET = 'documentos';

const dataUrlToBlob = async (dataUrl) => {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch (e) {
    console.error('Error converting data URL to blob:', e);
    return null;
  }
};

const getMimeFromDataUrl = (dataUrl) => {
  const match = String(dataUrl || '').match(/^data:([^;,]+)/);
  return match ? match[1] : 'application/octet-stream';
};

const blobToDataUrl = (blob) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => resolve(null);
  reader.readAsDataURL(blob);
});

const mimeToExt = {
  'application/pdf': 'pdf',
  'text/plain': 'txt',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
};

export const uploadDocFile = async (table, id, dataUrl) => {
  if (!dataUrl) return null;
  const blob = await dataUrlToBlob(dataUrl);
  if (!blob) return null;
  const mime = getMimeFromDataUrl(dataUrl) || blob.type || 'application/octet-stream';
  const ext = mimeToExt[mime] || blob.name?.split('.').pop() || 'bin';
  const path = `${table}/${id}.${ext}`;
  try {
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: mime,
      upsert: true
    });
    if (error) {
      console.warn('Storage upload failed, using DB fallback:', error && error.message ? error.message : error);
      return null;
    }
    return path;
  } catch (e) {
    console.warn('Storage upload error, using DB fallback:', e);
    return null;
  }
};

export const getDocFile = async (storagePath, existingDataUrl) => {
  if (!storagePath && !existingDataUrl) return null;
  if (!storagePath) return existingDataUrl || null;
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
    if (error || !data) return existingDataUrl || null;
    const dataUrl = await blobToDataUrl(data);
    return dataUrl || existingDataUrl || null;
  } catch (e) {
    console.error('Error downloading file from storage:', e);
    return existingDataUrl || null;
  }
};

export const deleteDocFile = async (storagePath) => {
  if (!storagePath) return;
  try {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch (e) {
    console.warn('Error deleting file from storage:', e);
  }
};