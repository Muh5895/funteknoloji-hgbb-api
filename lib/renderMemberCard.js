const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// ---- Fontları bir kere kayıt et ----
let fontsRegistered = false;
function ensureFonts() {
  if (fontsRegistered) return;
  const dir = path.join(__dirname, '..', 'assets');
  GlobalFonts.registerFromPath(path.join(dir, 'Poppins-Bold.ttf'), 'Poppins Bold');
  GlobalFonts.registerFromPath(path.join(dir, 'Poppins-SemiBold.ttf'), 'Poppins SemiBold');
  GlobalFonts.registerFromPath(path.join(dir, 'Poppins-Regular.ttf'), 'Poppins Regular');
  fontsRegistered = true;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#864FFE');
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 134, g: 79, b: 254 };
}

// Yumuşak, blur benzeri "aurora" leke — radial gradient ile
function drawAuroraBlob(ctx, cx, cy, r, rgb, alpha) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
  g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDotGrid(ctx, x, y, w, h, gap, rand) {
  ctx.save();
  for (let gx = x; gx < x + w; gx += gap) {
    for (let gy = y; gy < y + h; gy += gap) {
      ctx.globalAlpha = 0.03 + rand() * 0.05;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(gx, gy, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitFont(ctx, text, family, weight, maxSize, minSize, maxWidth) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px "${family}"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

async function loadAvatar(avatarUrl, rgb) {
  const fallbackSvg =
    'data:image/svg+xml;base64,' +
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
        <rect width="240" height="240" fill="#15111f"/>
        <circle cx="120" cy="96" r="44" fill="rgba(${rgb.r},${rgb.g},${rgb.b},0.55)"/>
        <ellipse cx="120" cy="225" rx="86" ry="66" fill="rgba(${rgb.r},${rgb.g},${rgb.b},0.55)"/>
      </svg>`
    ).toString('base64');

  if (!avatarUrl) return loadImage(fallbackSvg);
  try {
    const res = await fetch(avatarUrl);
    if (!res.ok) throw new Error('avatar fetch failed: ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    return await loadImage(buf);
  } catch (e) {
    return loadImage(fallbackSvg);
  }
}

/**
 * Özgün, marka temelli üye kartı (katılım/ayrılış) render eder.
 * Tasarım: koyu zemin + aurora leke (accentColor'a göre) + camsı sağ panelde avatar,
 * sol tarafta büyük isim + tek istatistik çipi.
 *
 * @param {Object} opts
 * @param {number} [opts.width=920]
 * @param {number} [opts.height=420]
 * @param {string} [opts.kicker="HOŞÇA KAL"]       Küçük üst etiket (nokta + uppercase)
 * @param {string} [opts.displayName="Kullanıcı"]  Büyük başlık (üyenin adı)
 * @param {string} [opts.dateText=""]              Alt satırdaki tarih metni
 * @param {string} [opts.dateLabel="Katılma tarihi"] Tarih satırının etiketi
 * @param {number} [opts.memberCount=0]            Tek istatistik çipi ("ÜYE SAYISI")
 * @param {string} [opts.avatarUrl]
 * @param {string} [opts.accentColor="#864FFE"]    Vurgu rengi (welcome: yeşil, leave: kırmızı)
 * @param {string} [opts.brandText=""]             Sağ üst köşede soluk watermark (opsiyonel)
 * @param {string} [opts.badgeText="AYRILDI"]      Avatarın altındaki rozet metni
 * @param {string} [opts.watermarkText]            Diagonal tekrar eden önizleme filigranı (opsiyonel)
 * @returns {Promise<Buffer>} PNG buffer
 */
async function renderMemberCard(opts = {}) {
  ensureFonts();

  const width = opts.width || 920;
  const height = opts.height || 420;
  const kicker = opts.kicker || 'HOŞÇA KAL';
  const displayName = opts.displayName || 'Kullanıcı';
  const dateText = opts.dateText || '';
  const dateLabel = opts.dateLabel || 'Katılma tarihi';
  const memberCount = Number(opts.memberCount || 0);
  const accent = opts.accentColor || '#864FFE';
  const rgb = hexToRgb(accent);
  const brandText = opts.brandText || '';
  const badgeText = opts.badgeText || 'AYRILDI';

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(7);

  const pad = 14;
  const cw = width - pad * 2;
  const ch = height - pad * 2;

  // ---- Dış zemin (kartın etrafı) ----
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  roundRect(ctx, pad, pad, cw, ch, 28);
  ctx.clip();

  // ---- Taban degrade ----
  const base = ctx.createLinearGradient(0, pad, 0, pad + ch);
  base.addColorStop(0, '#0c0912');
  base.addColorStop(1, '#050308');
  ctx.fillStyle = base;
  ctx.fillRect(pad, pad, cw, ch);

  // ---- Aurora lekeler (marka rengi) ----
  drawAuroraBlob(ctx, pad + cw * 0.12, pad + ch * 0.08, cw * 0.38, rgb, 0.4);
  drawAuroraBlob(ctx, pad + cw * 0.98, pad + ch * 0.98, cw * 0.32, rgb, 0.28);
  drawAuroraBlob(ctx, pad + cw * 0.78, pad + ch * 0.15, cw * 0.22, { r: 255, g: 255, b: 255 }, 0.05);

  // ---- Nokta doku ----
  drawDotGrid(ctx, pad, pad, cw, ch, 24, rand);

  // ---- İnce kenarlık (gradient) ----
  const borderGrad = ctx.createLinearGradient(pad, pad, pad + cw, pad + ch);
  borderGrad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.55)`);
  borderGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  borderGrad.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = borderGrad;
  roundRect(ctx, pad + 1, pad + 1, cw - 2, ch - 2, 27);
  ctx.stroke();

  // dikey ayırıcı ışık çizgisi (sol panel/avatar arası)
  const dividerX = pad + cw * 0.635;
  const divGrad = ctx.createLinearGradient(0, pad + ch * 0.12, 0, pad + ch * 0.88);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(dividerX, pad + ch * 0.12);
  ctx.lineTo(dividerX, pad + ch * 0.88);
  ctx.stroke();

  // brand watermark (sağ üst, soluk)
  if (brandText) {
    ctx.font = '600 13px "Poppins SemiBold"';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'right';
    ctx.fillText(brandText.toUpperCase(), pad + cw - 28, pad + 34);
    ctx.textAlign = 'left';
  }

  // ==================== SOL İÇERİK ====================
  const leftX = pad + cw * 0.055;
  const leftW = dividerX - leftX - cw * 0.04;
  let cursorY = pad + ch * 0.14;

  // kicker (nokta + etiket)
  ctx.beginPath();
  ctx.fillStyle = accent;
  ctx.arc(leftX + 4, cursorY - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '700 13px "Poppins Bold"';
  ctx.fillStyle = accent;
  ctx.fillText(kicker.toUpperCase(), leftX + 16, cursorY);

  // büyük isim
  cursorY += 46;
  const nameSize = fitFont(ctx, displayName, 'Poppins Bold', 700, 44, 24, leftW);
  ctx.font = `700 ${nameSize}px "Poppins Bold"`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(displayName, leftX, cursorY);

  // ince ayırıcı çizgi
  cursorY += 34;
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX, cursorY);
  ctx.lineTo(leftX + leftW, cursorY);
  ctx.stroke();

  // tek istatistik çipi (Üye Sayısı)
  const chipsY = cursorY + 22;
  const chipH = 84;
  const chipW = leftW * 0.42;
  roundRect(ctx, leftX, chipsY, chipW, chipH, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '700 11px "Poppins Bold"';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillText('ÜYE SAYISI', leftX + 14, chipsY + 24);

  ctx.font = '700 26px "Poppins Bold"';
  ctx.fillStyle = accent;
  ctx.fillText(String(memberCount), leftX + 14, chipsY + 57);

  // alt tarih satırı
  const dateY = chipsY + chipH + 32;
  if (dateY < pad + ch - 14 && dateText) {
    ctx.font = '400 13px "Poppins Regular"';
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    ctx.fillText(`${dateLabel}  ·  ${dateText}`, leftX, dateY);
  }

  // ==================== SAĞ PANEL: AVATAR ====================
  const avatarCx = pad + cw * (0.635 + (1 - 0.635) / 2);
  const avatarCy = pad + ch * 0.5;
  const avatarR = Math.min(ch * 0.34, (cw - dividerX + pad) * 0.36);

  // dış parıltı
  drawAuroraBlob(ctx, avatarCx, avatarCy, avatarR * 1.9, rgb, 0.45);

  try {
    const avatarImg = await loadAvatar(opts.avatarUrl, rgb);
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const s = Math.max((avatarR * 2) / avatarImg.width, (avatarR * 2) / avatarImg.height);
    const iw = avatarImg.width * s;
    const ih = avatarImg.height * s;
    ctx.drawImage(avatarImg, avatarCx - iw / 2, avatarCy - ih / 2, iw, ih);
    ctx.restore();
  } catch (e) {
    /* sessiz geç */
  }

  // avatar iç halkası
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.stroke();

  // rozet (avatarın alt kenarında)
  ctx.font = '700 11px "Poppins Bold"';
  const badgeW = ctx.measureText(badgeText).width + 24;
  const badgeH = 24;
  const badgeX = avatarCx - badgeW / 2;
  const badgeY = avatarCy + avatarR - badgeH / 2 + 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
  ctx.fillStyle = '#0c0912';
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 4);
  ctx.textAlign = 'left';

  // ---- opsiyonel önizleme filigranı ----
  if (opts.watermarkText) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 26px "Poppins Bold"';
    ctx.translate(pad + cw / 2, pad + ch / 2);
    ctx.rotate(-0.35);
    const t = opts.watermarkText.toUpperCase();
    const tw = ctx.measureText(t).width + 60;
    for (let y = -ch; y < ch; y += 46) {
      for (let x = -cw; x < cw; x += tw) {
        ctx.fillText(t, x, y);
      }
    }
    ctx.restore();
  }

  ctx.restore(); // clip sonu

  return canvas.encode('png');
}

module.exports = { renderMemberCard };
