# Universal Project Memory Operating System

Bu dokuman, herhangi bir projede baglam kaybi yasamadan calisabilmek icin kullanilacak genel hafiza, karar, rota ve kalite sistemidir.

Amac:
- Projeyi tek bir sohbete bagimli olmaktan cikarmak.
- Yapilanlari, yapilacaklari, karar gerekcelerini ve riskleri repo icinde kalici hale getirmek.
- Yeni oturum, yeni operator veya uzun ara sonrasinda projeyi ayni dogrultuda devam ettirebilmek.
- Sadece "not birakmak" degil, projenin yonunu ve kalite standardini kanitlanabilir sekilde korumak.

Bu sistem, ciddi urunler, ticari projeler, uzun sureli yazilimlar ve birden fazla oturumda ilerleyen her is icin tasarlanmistir.

## 1. Temel Ilkeler

1. Repo ici kod, dokuman ve artifact gercegi birincil kaynaktir.
2. Harici sohbet kayitlari, txt notlari, ekran goruntuleri ve tekil mesajlar yalnizca ikincil baglam kaynagidir.
3. Repo ile harici kaynak celisirse repo kazanir.
4. Her onemli calisma turu repoda kalici iz birakmalidir.
5. "Ne yapildi" kadar "neden yapildi" da yazilmalidir.
6. Handoff, roadmap, bug ledger ve release artifact zinciri ayni sistemin parcasidir; birbirinden kopuk tutulmaz.
7. Dogrulanmamis varsayim, belgeye gercek diye yazilmaz.

## 2. Kaynak Hiyerarsisi

Varsayilan kaynak sirasi:

1. Kod ve calisan sistem
2. Repo icindeki canon dokumanlari
3. Repo icindeki ops ve QA dokumanlari
4. Uretilmis artifactler ve status snapshotlari
5. Karar loglari
6. Session handoff
7. Harici sohbetler, txt dump'lari ve gecici notlar

Okuma sirasi da genelde buna yakin olmalidir.

## 3. Onerilen Dizin Yapisi

```text
docs/
  canon/
  ops/
  qa/
  templates/
output/
  status/
  qa/
  release/
artifacts/
  screenshots/
  logs/
  exports/
```

Amaclari:
- `docs/canon/`: projenin degismemesi gereken omurgasi
- `docs/ops/`: nasil calistirilir, deploy edilir, recover edilir
- `docs/qa/`: test, smoke, release readiness, audit ve inceleme kayitlari
- `docs/templates/`: baska projelere tasinabilir reusable sistem sablonlari
- `output/status/`: makine veya script tarafindan uretilen durum snapshotlari
- `output/qa/`: smoke, e2e, manual QA ve run artifactleri
- `output/release/`: release ozetleri, gate raporlari, deployment kanitlari
- `artifacts/`: gorsel ve yardimci kanitlar

## 4. Zorunlu Dokuman Seti

Asagidaki dosyalar ciddi projelerde minimum omurga olarak bulunmalidir.

### 4.1 `docs/canon/00_MASTER_MEMORY.md`

Projenin tek sayfalik ana zihni.

Icerik:
- proje tanimi
- hedef sonuc
- ana urun iddiasi
- hangi modullerin kritik oldugu
- aktif gercek durum
- en onemli blocker'lar
- bir sonraki mantikli adim

Bu dosya, projeyi ilk kez devralan kisi icin en kisa "neredeyiz" cevabidir.

### 4.2 `docs/canon/01_PRODUCT_OR_MISSION_CANON.md`

Urun veya projenin ne oldugunu sabitler.

Icerik:
- kullanici problemi
- hedef kullanici
- urun vaadi
- ana feature alanlari
- olmazsa olmaz davranislar
- kabul edilmeyecek kalite dusuklukleri

### 4.3 `docs/canon/02_TECH_CANON.md`

Teknik mimariyi sabitler.

Icerik:
- stack
- hosting/deploy modeli
- veri akislarinin ana haritasi
- auth modeli
- entegrasyonlar
- kritik scriptler ve kalite kapilari

### 4.4 `docs/canon/03_DATA_AND_INTEGRATION_CANON.md`

Veri, API, tablo, queue, cron, event ve entegrasyon gercegini tutar.

Icerik:
- veri kaynaklari
- tablo veya model omurgasi
- dis servisler
- environment degiskenleri
- bagimlilik riskleri
- migration gercegi

### 4.5 `docs/canon/04_EXECUTION_ROADMAP.md`

Fazlar, teslim mantigi ve yon sirasi.

Icerik:
- fazlar
- her fazin amaci
- faz cikis kriterleri
- bagimliliklar
- bugunku aktif faz
- siradaki faz

### 4.6 `docs/canon/05_WORKSTREAM_MAP.md`

Bu dosya, mevcut sistemlerde sik eksik kalan iyilestirmedir.

Icerik:
- urun
- backend
- frontend
- growth
- monetization
- ops
- QA
- security
- analytics

Her workstream icin:
- mevcut durum
- owner
- blokajlar
- siradaki isler

### 4.7 `docs/canon/06_BUG_GAP_LEDGER.md`

Eksikler, hatalar, kalite aciklari ve teknik borclar.

Her kayit icin:
- baslik
- etki alani
- siddet
- durum
- kaynak linki
- cozum notu

Bu dosya "bir gun bakariz" mezarligi olmamali; durum ve karar mantigi yazilmalidir.

### 4.8 `docs/canon/07_QA_RELEASE_CANON.md`

Kalite ve release standardi.

Icerik:
- hangi testler zorunlu
- smoke kapsaminda neler var
- release gate mantigi
- deploy oncesi kontrol listesi
- rollback gerektiren durumlar

### 4.9 `docs/canon/08_DECISION_LOG.md`

Karar kaydi.

Her karar icin:
- tarih
- karar
- neden
- alternatifler
- sonuc etkisi
- ilgili dosya veya artifact

Boylece "neden boyle yapilmisti" sorusu sohbete bagli kalmaz.

### 4.10 `docs/canon/09_ROLE_AUTHORITY_MODEL.md`

Kim neyi onaysiz yapabilir, hangi kararlar escalation ister.

Icerik:
- operator rolu
- owner rolu
- onay gerektiren alanlar
- geri donusu zor degisiklik sinirlari

### 4.11 `docs/canon/10_WORKING_AGREEMENT.md`

Calisma sekli ve kalite ahlaki.

Icerik:
- varsayilan otonomi seviyesi
- raporlama standardi
- commit disiplini
- dokuman guncelleme zorunlulugu
- test ve artifact beklentisi

### 4.12 `docs/canon/11_PROGRESS_LOG.md`

Bu da mevcut sistemlerden daha iyi bir ek katmandir.

Amac:
- buyuk yol haritasi ile session handoff arasindaki boslugu kapatmak

Icerik:
- tarih sirali ilerleme notlari
- ne tamamlandi
- ne bloke oldu
- neden yon degisti
- hangi artifact uretildi

Bu dosya, aylar sonra "hangi gun ne oldu" sorusunu cevaplar.

### 4.13 `docs/canon/12_SESSION_HANDOFF.md`

Anlik devralma dosyasi.

Icerik:
- bugun aktif konu
- repo gercegi
- acik blocker
- en yakin sonraki adim
- dikkat edilmesi gereken risk

Bu dosya her ciddi turun sonunda guncellenmelidir.

### 4.14 `docs/canon/13_RISK_REGISTER.md`

Bu dokuman mevcut sistemlerde cogunlukla eksik olur ama cok degerlidir.

Icerik:
- urun riski
- teknik risk
- operasyon riski
- ticari risk
- bagimlilik riski
- veri riski

Her risk icin:
- olasilik
- etki
- erken sinyal
- azaltma plani

### 4.15 `docs/canon/14_ASSUMPTIONS_LOG.md`

Sohbet kaynakli gizli varsayimlari yakalamak icin kullanilir.

Her varsayim icin:
- varsayim metni
- dogrulandi mi
- neye dayaniyor
- ne zaman kaldirilacak

Bu dosya, "biz bunu dogru saniyorduk" kaynakli baglam kazalarini azaltir.

### 4.16 `docs/canon/15_DEPENDENCY_AND_ENV_MAP.md`

Dis servis ve ortam haritasi.

Icerik:
- servis adi
- owner
- environment'lar
- gerekli env degiskenleri
- health check yontemi
- failure semptomlari
- remediation adimlari

## 5. Ops Dokumanlari

`docs/ops/` altinda asgari su dokumanlar olmali:

- `RUNBOOK.md`
- `DEPLOY_FLOW.md`
- `RECOVERY_PLAYBOOK.md`
- `SECRETS_AND_ENV_SETUP.md`
- `MIGRATION_POLICY.md`
- `ROLLBACK_PLAYBOOK.md`

Amac:
- operasyon bilgisi tek kisinin kafasinda kalmasin
- production veya staging aksiyonlari tekrarlanabilir olsun
- hata aninda panik degil prosedur islesin

## 6. QA Dokumanlari

`docs/qa/` altinda su siniflar bulunmali:

- release readiness raporlari
- smoke sonuc notlari
- derin audit dokumanlari
- regression kayitlari
- manuel test checklistleri
- performans ve gozlem ozetleri

Her QA dokumani su sorulari cevaplamalidir:
- ne test edildi
- hangi ortamda test edildi
- sonuc ne oldu
- artifact nerede
- blocker var mi
- sonraki adim ne

## 7. Artifact Sistemi

Metin dokumani tek basina yetmez. Kritik calismalarda artifact uretilmelidir.

Onerilen artifactler:
- `output/status/*.json`
- `output/qa/<run-id>/summary.json`
- ekran goruntuleri
- log exportlari
- build veya deploy ozetleri
- DB health veya service health snapshotlari

Kural:
- Belgesiz iddia yerine artifact destekli iddia tercih edilir.

## 8. Guncelleme Ritimleri

### Her ciddi tur sonunda

Guncellenmeli:
- `12_SESSION_HANDOFF.md`
- gerekirse `11_PROGRESS_LOG.md`
- ilgili QA veya status artifact

### Her karar degisiminde

Guncellenmeli:
- `08_DECISION_LOG.md`

### Faz veya yon degisiminde

Guncellenmeli:
- `04_EXECUTION_ROADMAP.md`
- `05_WORKSTREAM_MAP.md`
- gerekiyorsa `13_RISK_REGISTER.md`

### Yeni blocker veya kalite aciginda

Guncellenmeli:
- `06_BUG_GAP_LEDGER.md`

### Yeni entegrasyon veya altyapi degisiminde

Guncellenmeli:
- `03_DATA_AND_INTEGRATION_CANON.md`
- `15_DEPENDENCY_AND_ENV_MAP.md`
- ilgili ops runbook'lari

## 9. Okuma Protokolu

Projeyi devralan kisi icin hizli okuma sirasi:

1. `docs/canon/00_MASTER_MEMORY.md`
2. `docs/canon/12_SESSION_HANDOFF.md`
3. `docs/canon/04_EXECUTION_ROADMAP.md`
4. `docs/canon/06_BUG_GAP_LEDGER.md`
5. `docs/canon/08_DECISION_LOG.md`
6. `docs/canon/13_RISK_REGISTER.md`
7. ilgili `docs/qa/` raporlari
8. sonra kod

Boylece kisi once "yon ve durum", sonra "risk ve aciklar", sonra "uygulama" gorur.

## 10. Handoff Protokolu

Her ciddi tur sonunda handoff su 6 soruya cevap vermelidir:

1. Su an gercek durum ne?
2. Bu turda tam olarak ne yapildi?
3. Ne dogrulandi?
4. Ne bloklu kaldi?
5. Bir sonraki mantikli adim ne?
6. Yeni gelen operatorun dikkat etmesi gereken risk ne?

Kisa ama denetlenebilir yazilmalidir.

## 11. Bu Sistemi Bizimkinden Daha Iyi Yapan Seyler

Asagidaki katmanlar mevcut sistemleri guclendirir:

1. `05_WORKSTREAM_MAP.md`
Neden iyi:
- roadmap'i yatay is alanlarina boler
- "faz" ile "is akisi" arasindaki karisiklik azalir

2. `11_PROGRESS_LOG.md`
Neden iyi:
- handoff cok anliktir, roadmap cok buyuktur
- bu dosya aradaki zamani baglar

3. `13_RISK_REGISTER.md`
Neden iyi:
- teknik ve ticari risk ayni yerde gorunur
- surprise failure sayisi azalir

4. `14_ASSUMPTIONS_LOG.md`
Neden iyi:
- sohbet kaynakli sanilar kalici gercek gibi davranilmaz

5. `15_DEPENDENCY_AND_ENV_MAP.md`
Neden iyi:
- staging/prod/env drift daha erken fark edilir

6. `ROLLBACK_PLAYBOOK.md`
Neden iyi:
- bir sey bozuldugunda "ne yapacagiz" daha once yazilmis olur

## 12. Kotu Ornekler

Su davranislar sistem disidir:

- her seyi sadece sohbette tutmak
- karar alip decision log yazmamak
- QA yapip artifact birakmamak
- roadmap'i guncellemeden yon degistirmek
- blocker'i gizleyip sadece "ilerliyor" yazmak
- stale dokumani gercek saniyor gibi davranmak
- teknik borcu bug ledger yerine kafada tutmak

## 13. Kucuk Projeler Icin Hafif Surum

Eger proje kucukse asgari surum su olabilir:

- `00_MASTER_MEMORY.md`
- `02_TECH_CANON.md`
- `04_EXECUTION_ROADMAP.md`
- `06_BUG_GAP_LEDGER.md`
- `08_DECISION_LOG.md`
- `12_SESSION_HANDOFF.md`

Ama ciddi urunlerde tam surum onerilir.

## 14. Yeni Bir Projeyi Bu Sistemle Baslatma Checklist'i

1. `docs/canon/`, `docs/ops/`, `docs/qa/`, `docs/templates/` klasorlerini ac.
2. `00_MASTER_MEMORY.md` olustur ve tek sayfada proje gercegini yaz.
3. urun, teknik ve veri canon'unu ayir.
4. roadmap ve workstream map'i yaz.
5. decision log ve bug ledger'i ilk gunden ac.
6. session handoff dosyasini her tur sonunda guncelle.
7. smoke veya status artifact uretecek minimum scriptleri kur.
8. release ve rollback mantigini bastan yaz.
9. assumptions log ve dependency/env map ile gizli riskleri gorunur yap.
10. artik proje sohbete degil sisteme bagli hale gelir.

## 15. Sonuc

Iyi bir proje hafizasi:
- sadece not klasoru degildir
- sadece wiki degildir
- sadece roadmap degildir
- sadece handoff degildir

Iyi bir proje hafizasi, karar, durum, risk, QA, artifact ve bir sonraki adimi ayni omurgada birlestiren isletim sistemidir.

Bu dokumanin amaci, herhangi bir projede "baglam kaydi, niyet kaydi, ne yapildigi unutuldu" sorununu minimuma indirmektir.
