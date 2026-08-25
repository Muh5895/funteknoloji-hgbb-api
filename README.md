# fun-hgbb

Fun Teknoloji — Discord sunucuları için **"Hoş Geldin" (yeşil)** ve **"Hoşça Kal" (kırmızı)** kart görseli üreten Vercel serverless API. `@napi-rs/canvas` ile sunucuda PNG olarak render edilir. Canlı: **https://fun-hgbb.vercel.app**

## Dosya yapısı

```
fun-hgbb/
├── api/
│   ├── welcome.js               # GET /api/welcome  (yeşil)
│   └── leave.js                 # GET /api/leave    (kırmızı)
├── lib/
│   └── renderMemberCard.js      # Ortak çizim mantığı (canvas)
├── assets/
│   ├── Poppins-Bold.ttf
│   ├── Poppins-SemiBold.ttf
│   └── Poppins-Regular.ttf
├── public/
│   └── index.html               # fun-hgbb.vercel.app/ kök sayfası
├── scripts/
│   └── generatePreview.js       # Yerel PNG önizleme üretici
├── package.json
├── vercel.json
└── .gitignore
```

## GitHub'a yükleme

```bash
cd fun-hgbb
git init
git add .
git commit -m "fun-hgbb: welcome/leave card API"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/fun-hgbb.git
git push -u origin main
```

## Vercel'e deploy

**Vercel Dashboard üzerinden (önerilen):**
1. [vercel.com/new](https://vercel.com/new) → GitHub reponu (`fun-hgbb`) seç → Import.
2. Framework Preset: **Other**. Build/Output ayarlarına dokunma (serverless function'lar `api/` altından otomatik algılanır).
3. Project Name alanına **`fun-hgbb`** yaz — bu, `https://fun-hgbb.vercel.app` adresini verir (isim boştaysa).
4. Deploy'a bas.

**CLI ile:**
```bash
npm i -g vercel
vercel login
vercel --prod
# "Set up and deploy"? Yes
# "Link to existing project?" No
# "What's your project's name?" -> fun-hgbb
```

> Not: `fun-hgbb` adı başka bir Vercel kullanıcısı tarafından alınmışsa Vercel otomatik olarak `fun-hgbb-xxxx.vercel.app` gibi bir adres verir. Bu durumda Project Settings → Domains'ten manuel olarak `fun-hgbb.vercel.app` eklemeyi deneyebilirsin (müsaitse).

## Kullanım / Örnek URL'ler

Taban adres: `https://fun-hgbb.vercel.app`

### Hoş Geldin (yeşil)
```
https://fun-hgbb.vercel.app/api/welcome?displayName=Muhammed&memberCount=217&date=25.08.2026%20-%2011:20:00&avatarUrl=https://cdn.discordapp.com/embed/avatars/0.png
```

### Hoşça Kal (kırmızı)
```
https://fun-hgbb.vercel.app/api/leave?displayName=Muhammed&memberCount=216&date=25.08.2026%20-%2011:20:00&avatarUrl=https://cdn.discordapp.com/embed/avatars/0.png
```

Tarayıcıya yapıştırıp direkt açabilirsin — yanıt `image/png` olarak döner.

### Parametreler (her iki endpoint için ortak)

| Parametre     | Tip     | welcome varsayılan | leave varsayılan | Açıklama                                 |
|---------------|---------|---------------------|-------------------|---------------------------------------------|
| `displayName` | string  | `Kullanıcı`         | `Kullanıcı`       | Büyük başlık — üyenin adı                    |
| `memberCount` | number  | `0`                 | `0`               | "ÜYE SAYISI" çipi                            |
| `date`        | string  | —                   | —                 | Alt tarih satırı değeri                      |
| `dateLabel`   | string  | `Katılma tarihi`    | `Katılma tarihi`  | Alt tarih satırının etiketi                  |
| `avatarUrl`   | string  | —                   | —                 | Üyenin avatar görseli (Discord CDN vs.)      |
| `kicker`      | string  | `HOŞ GELDİN`        | `HOŞÇA KAL`       | Sol üstteki küçük etiket                     |
| `badgeText`   | string  | `KATILDI`           | `AYRILDI`         | Avatarın altındaki rozet metni               |
| `accentColor` | hex     | `#22c55e`           | `#ef4444`         | Vurgu rengi (istersen override et)           |
| `brandText`   | string  | —                   | —                 | Sağ üstte soluk watermark (opsiyonel)        |
| `width`       | number  | `920`               | `920`             | Görsel genişliği                             |
| `height`      | number  | `420`               | `420`             | Görsel yüksekliği                            |

**Not:** `avatarUrl` gibi URL içeren parametreleri her zaman `encodeURIComponent()` ile kodla; sorgu string'i içinde `&` / `?` karakteri varsa istek bozulur.

### Discord.js entegrasyonu

```js
const { AttachmentBuilder } = require('discord.js');

const BASE = 'https://fun-hgbb.vercel.app/api';

async function sendMemberCard(type, member, channel) {
  const url = new URL(`${BASE}/${type}`); // type: 'welcome' | 'leave'
  url.searchParams.set('displayName', member.user.username);
  url.searchParams.set('avatarUrl', member.user.displayAvatarURL({ extension: 'png', size: 256 }));
  url.searchParams.set('memberCount', String(member.guild.memberCount));
  url.searchParams.set('date', new Date().toLocaleString('tr-TR'));

  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  channel.send({ files: [new AttachmentBuilder(buffer, { name: `${type}.png` })] });
}

client.on('guildMemberAdd', (m) => sendMemberCard('welcome', m, logChannel));
client.on('guildMemberRemove', (m) => sendMemberCard('leave', m, logChannel));
```

## Yerel geliştirme

```bash
npm install
npm run preview        # preview/welcome-preview.png ve leave-preview.png üretir
vercel dev             # http://localhost:3000/api/welcome ... şeklinde yerel test
```

## Özelleştirme

Tüm çizim `lib/renderMemberCard.js` içinde tek bir fonksiyonda (`renderMemberCard`) toplanmıştır; `api/welcome.js` ve `api/leave.js` sadece farklı varsayılan renk/metinlerle bu fonksiyonu çağırır. Yeni bir kart tipi eklemek istersen (ör. `/api/ban`), `api/` altına benzer bir dosya + kendi varsayılanlarını eklemen yeterli.
