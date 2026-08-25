Fun Teknoloji — Discord sunucuları için **"Hoş Geldin"** ve **"Hoşça Kal"** kart görseli üreten API. `@napi-rs/canvas` ile sunucuda PNG olarak render edilir.

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


## Kullanım / Örnek URL'ler

Taban adres: `https://fun-hgbb.vercel.app`

### Hoş Geldin
```
https://fun-hgbb.vercel.app/api/welcome?displayName=Muhammed&memberCount=217&date=25.08.2026%20-%2011:20:00&avatarUrl=https://cdn.discordapp.com/embed/avatars/0.png
```

### Hoşça Kal
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

## Özelleştirme

Tüm çizim `lib/renderMemberCard.js` içinde tek bir fonksiyonda (`renderMemberCard`) toplanmıştır; `api/welcome.js` ve `api/leave.js` sadece farklı varsayılan renk/metinlerle bu fonksiyonu çağırır. Yeni bir kart tipi eklemek istersen (ör. `/api/ban`), `api/` altına benzer bir dosya + kendi varsayılanlarını eklemen yeterli.
