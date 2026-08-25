const fs = require('fs');
const path = require('path');
const { renderMemberCard } = require('../lib/renderMemberCard');

(async () => {
  const outDir = path.join(__dirname, '..', 'preview');
  fs.mkdirSync(outDir, { recursive: true });

  const welcomeBuf = await renderMemberCard({
    kicker: 'HOŞ GELDİN',
    displayName: 'Kullanıcı Adı',
    dateText: 'GG.AA.YYYY - SS:DD:SS',
    memberCount: 0,
    accentColor: '#22c55e',
    badgeText: 'KATILDI',
  });
  fs.writeFileSync(path.join(outDir, 'welcome-preview.png'), welcomeBuf);

  const leaveBuf = await renderMemberCard({
    kicker: 'HOŞÇA KAL',
    displayName: 'Kullanıcı Adı',
    dateText: 'GG.AA.YYYY - SS:DD:SS',
    memberCount: 0,
    accentColor: '#ef4444',
    badgeText: 'AYRILDI',
  });
  fs.writeFileSync(path.join(outDir, 'leave-preview.png'), leaveBuf);

  console.log('Yazıldı: welcome-preview.png, leave-preview.png');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
