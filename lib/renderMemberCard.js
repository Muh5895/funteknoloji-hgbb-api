const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const path = require('path');

// ---- Fontları bir kere kayıt et ----
let fontsRegistered = false;

function ensureFonts() {
  if (fontsRegistered) return;

  const dir = path.join(__dirname, '..', 'assets');

  GlobalFonts.registerFromPath(
    path.join(dir, 'Poppins-Bold.ttf'),
    'Poppins Bold'
  );

  GlobalFonts.registerFromPath(
    path.join(dir, 'Poppins-SemiBold.ttf'),
    'Poppins SemiBold'
  );

  GlobalFonts.registerFromPath(
    path.join(dir, 'Poppins-Regular.ttf'),
    'Poppins Regular'
  );

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
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex || '#864FFE'
  );

  return m
    ? {
        r: parseInt(m[1], 16),
        g: parseInt(m[2], 16),
        b: parseInt(m[3], 16),
      }
    : {
        r: 134,
        g: 79,
        b: 254,
      };
}

// ---- Aurora ----

function drawAuroraBlob(ctx, cx, cy, r, rgb, alpha) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);

  g.addColorStop(
    0,
    `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
  );

  g.addColorStop(
    1,
    `rgba(${rgb.r},${rgb.g},${rgb.b},0)`
  );

  ctx.fillStyle = g;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Nokta grid ----

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

// ---- Yazıyı alana sığdır ----

function fitFont(
  ctx,
  text,
  family,
  weight,
  maxSize,
  minSize,
  maxWidth
) {
  let size = maxSize;

  while (size > minSize) {
    ctx.font = `${weight} ${size}px "${family}"`;

    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }

    size -= 2;
  }

  return size;
}

// ---- Avatar ----

async function loadAvatar(avatarUrl, rgb) {
  const fallbackSvg =
    'data:image/svg+xml;base64,' +
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
        <rect width="240" height="240" fill="#15111f"/>
        <circle cx="120" cy="96" r="44"
          fill="rgba(${rgb.r},${rgb.g},${rgb.b},0.55)"/>
        <ellipse cx="120" cy="225" rx="86" ry="66"
          fill="rgba(${rgb.r},${rgb.g},${rgb.b},0.55)"/>
      </svg>`
    ).toString('base64');

  if (!avatarUrl) {
    return loadImage(fallbackSvg);
  }

  try {
    const res = await fetch(avatarUrl);

    if (!res.ok) {
      throw new Error('avatar fetch failed: ' + res.status);
    }

    const buf = Buffer.from(await res.arrayBuffer());

    return await loadImage(buf);
  } catch (e) {
    return loadImage(fallbackSvg);
  }
}

/**
 * Fun Teknoloji - Hoş Geldin / Hoşça Kal kartı
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

  // ---- Genel ölçüler ----

  const pad = 14;

  const cw = width - pad * 2;
  const ch = height - pad * 2;

  // ---- Dış zemin ----

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  ctx.save();

  roundRect(ctx, pad, pad, cw, ch, 28);
  ctx.clip();

  // ---- Taban degrade ----

  const base = ctx.createLinearGradient(
    0,
    pad,
    0,
    pad + ch
  );

  base.addColorStop(0, '#0c0912');
  base.addColorStop(1, '#050308');

  ctx.fillStyle = base;

  ctx.fillRect(
    pad,
    pad,
    cw,
    ch
  );

  // ---- Aurora ----

  drawAuroraBlob(
    ctx,
    pad + cw * 0.12,
    pad + ch * 0.08,
    cw * 0.38,
    rgb,
    0.4
  );

  drawAuroraBlob(
    ctx,
    pad + cw * 0.98,
    pad + ch * 0.98,
    cw * 0.32,
    rgb,
    0.28
  );

  drawAuroraBlob(
    ctx,
    pad + cw * 0.78,
    pad + ch * 0.15,
    cw * 0.22,
    {
      r: 255,
      g: 255,
      b: 255,
    },
    0.05
  );

  // ---- Nokta doku ----

  drawDotGrid(
    ctx,
    pad,
    pad,
    cw,
    ch,
    24,
    rand
  );

  // ---- Kenarlık ----

  const borderGrad = ctx.createLinearGradient(
    pad,
    pad,
    pad + cw,
    pad + ch
  );

  borderGrad.addColorStop(
    0,
    `rgba(${rgb.r},${rgb.g},${rgb.b},0.55)`
  );

  borderGrad.addColorStop(
    0.5,
    'rgba(255,255,255,0.08)'
  );

  borderGrad.addColorStop(
    1,
    `rgba(${rgb.r},${rgb.g},${rgb.b},0.35)`
  );

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = borderGrad;

  roundRect(
    ctx,
    pad + 1,
    pad + 1,
    cw - 2,
    ch - 2,
    27
  );

  ctx.stroke();

  // ---- Dikey ayırıcı ----

  const dividerX = pad + cw * 0.635;

  const divGrad = ctx.createLinearGradient(
    0,
    pad + ch * 0.12,
    0,
    pad + ch * 0.88
  );

  divGrad.addColorStop(
    0,
    'rgba(255,255,255,0)'
  );

  divGrad.addColorStop(
    0.5,
    'rgba(255,255,255,0.12)'
  );

  divGrad.addColorStop(
    1,
    'rgba(255,255,255,0)'
  );

  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    dividerX,
    pad + ch * 0.12
  );

  ctx.lineTo(
    dividerX,
    pad + ch * 0.88
  );

  ctx.stroke();

  // ==================================================
  // BRAND
  // ==================================================

  if (brandText) {
    ctx.font =
      '600 15px "Poppins SemiBold"';

    ctx.fillStyle =
      'rgba(255,255,255,0.28)';

    ctx.textAlign = 'right';

    ctx.fillText(
      brandText.toUpperCase(),
      pad + cw - 28,
      pad + 38
    );

    ctx.textAlign = 'left';
  }

  // ==================================================
  // SOL PANEL
  // ==================================================

  const leftX =
    pad + cw * 0.055;

  const leftW =
    dividerX -
    leftX -
    cw * 0.04;

  let cursorY =
    pad + ch * 0.14;

  // ---- KICKER ----

  ctx.beginPath();

  ctx.fillStyle = accent;

  ctx.arc(
    leftX + 5,
    cursorY - 5,
    5,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.font =
    '700 17px "Poppins Bold"';

  ctx.fillStyle = accent;

  ctx.fillText(
    kicker.toUpperCase(),
    leftX + 19,
    cursorY
  );

  // ---- BÜYÜK İSİM ----

  cursorY += 55;

  const nameSize = fitFont(
    ctx,
    displayName,
    'Poppins Bold',
    700,
    58,
    30,
    leftW
  );

  ctx.font =
    `700 ${nameSize}px "Poppins Bold"`;

  ctx.fillStyle = '#ffffff';

  ctx.fillText(
    displayName,
    leftX,
    cursorY
  );

  // ---- AYIRICI ----

  cursorY += 42;

  ctx.strokeStyle =
    'rgba(255,255,255,0.08)';

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    leftX,
    cursorY
  );

  ctx.lineTo(
    leftX + leftW,
    cursorY
  );

  ctx.stroke();

  // ==================================================
  // ÜYE SAYISI ÇİPİ
  // ==================================================

  const chipsY =
    cursorY + 24;

  const chipH = 92;

  const chipW =
    leftW * 0.46;

  roundRect(
    ctx,
    leftX,
    chipsY,
    chipW,
    chipH,
    16
  );

  ctx.fillStyle =
    'rgba(255,255,255,0.04)';

  ctx.fill();

  ctx.strokeStyle =
    'rgba(255,255,255,0.09)';

  ctx.lineWidth = 1;

  ctx.stroke();

  // ---- ÜYE SAYISI ----

  ctx.font =
    '700 14px "Poppins Bold"';

  ctx.fillStyle =
    'rgba(255,255,255,0.42)';

  ctx.fillText(
    'ÜYE SAYISI',
    leftX + 16,
    chipsY + 27
  );

  // ---- SAYI ----

  const countText =
    String(memberCount);

  const countSize = fitFont(
    ctx,
    countText,
    'Poppins Bold',
    700,
    34,
    24,
    chipW - 32
  );

  ctx.font =
    `700 ${countSize}px "Poppins Bold"`;

  ctx.fillStyle = accent;

  ctx.fillText(
    countText,
    leftX + 16,
    chipsY + 65
  );

  // ==================================================
  // TARİH
  // ==================================================

  const dateY =
    chipsY + chipH + 34;

  if (
    dateY < pad + ch - 12 &&
    dateText
  ) {
    const fullDate =
      `${dateLabel}  ·  ${dateText}`;

    const dateSize = fitFont(
      ctx,
      fullDate,
      'Poppins Regular',
      400,
      16,
      11,
      leftW
    );

    ctx.font =
      `400 ${dateSize}px "Poppins Regular"`;

    ctx.fillStyle =
      'rgba(255,255,255,0.42)';

    ctx.fillText(
      fullDate,
      leftX,
      dateY
    );
  }

  // ==================================================
  // SAĞ PANEL / AVATAR
  // ==================================================

  const avatarCx =
    pad +
    cw *
      (0.635 + (1 - 0.635) / 2);

  const avatarCy =
    pad + ch * 0.5;

  // Avatarı biraz büyüttük
  const avatarR =
    Math.min(
      ch * 0.37,
      (cw - dividerX + pad) * 0.39
    );

  // ---- Avatar aura ----

  drawAuroraBlob(
    ctx,
    avatarCx,
    avatarCy,
    avatarR * 1.95,
    rgb,
    0.45
  );

  // ---- Avatar ----

  try {
    const avatarImg =
      await loadAvatar(
        opts.avatarUrl,
        rgb
      );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarCx,
      avatarCy,
      avatarR,
      0,
      Math.PI * 2
    );

    ctx.closePath();
    ctx.clip();

    const s =
      Math.max(
        (avatarR * 2) /
          avatarImg.width,
        (avatarR * 2) /
          avatarImg.height
      );

    const iw =
      avatarImg.width * s;

    const ih =
      avatarImg.height * s;

    ctx.drawImage(
      avatarImg,
      avatarCx - iw / 2,
      avatarCy - ih / 2,
      iw,
      ih
    );

    ctx.restore();
  } catch (e) {
    // sessiz geç
  }

  // ---- Avatar halkası ----

  ctx.lineWidth = 3;

  ctx.strokeStyle =
    'rgba(255,255,255,0.85)';

  ctx.beginPath();

  ctx.arc(
    avatarCx,
    avatarCy,
    avatarR,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  // ==================================================
  // BADGE
  // ==================================================

  ctx.font =
    '700 14px "Poppins Bold"';

  const badgeW =
    ctx.measureText(badgeText).width +
    30;

  const badgeH = 30;

  const badgeX =
    avatarCx -
    badgeW / 2;

  const badgeY =
    avatarCy +
    avatarR -
    badgeH / 2 +
    2;

  roundRect(
    ctx,
    badgeX,
    badgeY,
    badgeW,
    badgeH,
    badgeH / 2
  );

  ctx.fillStyle =
    '#0c0912';

  ctx.fill();

  ctx.strokeStyle = accent;

  ctx.lineWidth = 1.5;

  ctx.stroke();

  ctx.fillStyle = accent;

  ctx.textAlign = 'center';

  ctx.fillText(
    badgeText,
    badgeX + badgeW / 2,
    badgeY + badgeH / 2 + 5
  );

  ctx.textAlign = 'left';

  // ==================================================
  // WATERMARK
  // ==================================================

  if (opts.watermarkText) {
    ctx.save();

    ctx.globalAlpha = 0.06;

    ctx.fillStyle = '#ffffff';

    ctx.font =
      '700 26px "Poppins Bold"';

    ctx.translate(
      pad + cw / 2,
      pad + ch / 2
    );

    ctx.rotate(-0.35);

    const t =
      opts.watermarkText.toUpperCase();

    const tw =
      ctx.measureText(t).width + 60;

    for (
      let y = -ch;
      y < ch;
      y += 46
    ) {
      for (
        let x = -cw;
        x < cw;
        x += tw
      ) {
        ctx.fillText(
          t,
          x,
          y
        );
      }
    }

    ctx.restore();
  }

  // ---- Clip sonu ----

  ctx.restore();

  return canvas.encode('png');
}

module.exports = {
  renderMemberCard,
};
