const { renderMemberCard } = require('../lib/renderMemberCard');

/**
 * GET /api/welcome  — "Hoş Geldin" kartı (yeşil tema)
 *
 * Query parametreleri:
 *  - kicker       (string)  Varsayılan "HOŞ GELDİN"
 *  - displayName  (string)  Büyük başlık (üyenin adı)
 *  - avatarUrl    (string)  Avatar görsel URL'i
 *  - date         (string)  Alt satırdaki tarih metni
 *  - dateLabel    (string)  Varsayılan "Katılma tarihi"
 *  - memberCount  (number)  "ÜYE SAYISI" çipi
 *  - accentColor  (hex)     Varsayılan #22c55e (yeşil)
 *  - badgeText    (string)  Varsayılan "KATILDI"
 *  - brandText    (string)  Sağ üstte soluk watermark, opsiyonel
 *  - width/height (number)  Varsayılan 920x420
 */
module.exports = async function handler(req, res) {
  try {
    const q = req.query || {};

    const buffer = await renderMemberCard({
      width: q.width ? Number(q.width) : undefined,
      height: q.height ? Number(q.height) : undefined,
      kicker: q.kicker || 'HOŞ GELDİN',
      displayName: q.displayName || q.username,
      dateText: q.date,
      dateLabel: q.dateLabel || 'Katılma tarihi',
      memberCount: q.memberCount,
      avatarUrl: q.avatarUrl,
      accentColor: q.accentColor || '#22c55e',
      brandText: q.brandText,
      badgeText: q.badgeText || 'KATILDI',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('welcome-card render error:', err);
    res.status(500).json({ error: 'render_failed', message: err.message });
  }
};
