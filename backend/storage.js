const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET;
const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  : null;

async function uploadReportPhoto(dataUrl, reportId) {
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error('Photo must be a JPEG, PNG, or WebP data URL.');
  if (!supabase || !bucket) throw new Error('Report photo storage is not configured.');

  const extension = match[1] === 'jpeg' ? 'jpg' : match[1];
  const image = Buffer.from(match[2], 'base64');
  if (!image.length || image.length > 5 * 1024 * 1024) {
    throw new Error('Photo must be smaller than 5 MB.');
  }

  const path = 'reports/' + reportId + '-' + crypto.randomUUID() + '.' + extension;
  const { error } = await supabase.storage.from(bucket).upload(path, image, {
    contentType: 'image/' + match[1],
    upsert: false
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

module.exports = { uploadReportPhoto };