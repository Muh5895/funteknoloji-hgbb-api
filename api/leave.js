const { renderMemberCard } = require('../lib/renderMemberCard');

/**
 * GET /api/leave  — "Hoşça Kal" kartı (kırmızı tema)
 *
 * Query parametreleri:
 *  - kicker       (string)  Varsayılan "HOŞÇA KAL"
 *  - displayName  (string)  Büyük başlık (üyenin adı)
 *  - avatarUrl    (string)  Avatar görsel URL'i
 *  - date         (string)  Alt satırdaki tarih metni
 *  - dateLabel    (string)  Varsayılan "Katılma tarihi"
 *  - memberCount  (number)  "ÜYE SAYISI" çipi
 *  - accentColor  (hex)     Varsayılan #ef4444 (kırmızı)
 *  - badgeText    (string)  Varsayılan "AYRILDI"
 *  - brandText    (string)  Sağ üstte soluk watermark, opsiyonel
 *  - width/height (number)  Varsayılan 920x420
 */
module.exports = async function handler(req, res) {
  try {
    const q = req.query || {};

    const buffer = await renderMemberCard({
      width: q.width ? Number(q.width) : undefined,
      height: q.height ? Number(q.height) : undefined,
      kicker: q.kicker || 'HOŞÇA KAL',
      displayName: q.displayName || q.username,
      dateText: q.date,
      dateLabel: q.dateLabel || 'Katılma tarihi',
      memberCount: q.memberCount,
      avatarUrl: q.avatarUrl,
      accentColor: q.accentColor || '#ef4444',
      brandText: q.brandText,
      badgeText: q.badgeText || 'AYRILDI',
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).send(buffer);
  } catch (err) {
    console.error('leave-card render error:', err);
    res.status(500).json({ error: 'render_failed', message: err.message });
  }
};
