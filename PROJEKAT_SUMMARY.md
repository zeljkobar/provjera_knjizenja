# Summa Summarum Portal - pregled projekta

## Trenutno stanje

Aplikacija je lokalni Node/Express portal koji radi na portu `8585`.

Glavna adresa lokalno:

```text
http://localhost:8585
```

Preko Cloudflare Tunnel-a aplikacija je povezana na domen:

```text
knjigovodstvoonline.com
```

`index.html` je sada login stranica. Stari početni dashboard je sačuvan kao `admin.html` i dostupan je samo poslije admin prijave.

## Struktura stranica

### Javna stranica

- `index.html`
  - Login forma.
  - Koristi `login.js`.
  - Nakon uspješne prijave šalje korisnika na `admin.html`.

### Admin stranice

- `admin.html`
  - Stari glavni dashboard.
  - Linkovi ka:
    - `banke.html`
    - `plate.html`
  - Ima dugme `Odjava`.

- `banke.html`
  - Stranica za izvode banaka.
  - Vraća se na `admin.html`.
  - Ima dugme `Odjava`.

- `plate.html`
  - Stranica za plate.
  - Vraća se na `admin.html`.
  - Ima dugme `Odjava`.

### Klijentske stranice

Još nisu napravljene.

Plan je da se za obične korisnike naprave posebne stranice, odvojene od admin dijela, npr. za pregled kartica, kupaca i dobavljača.

## Login i sigurnost

Dodato je logovanje preko nove baze `Portal`.

U `server.js` je dodata posebna konekcija:

```text
Portal
```

Tabela za korisnike:

```text
dbo.ClientUsers
```

Tabela za sesije:

```text
dbo.ClientSessions
```

Tabela za vezu korisnik-firma:

```text
dbo.ClientUserFirme
```

Admin korisnik ima:

```text
Role = 'admin'
```

Klijentski korisnici imaju:

```text
Role = 'user'
```

Lozinke se ne čuvaju kao običan tekst, nego kao `scrypt` hash.

Sesija se čuva u cookie-ju:

```text
admin_session
```

Cookie je `HttpOnly`, traje 7 dana i koristi se za provjeru da li je korisnik prijavljen.

## Zaštita ruta

Uklonjeno je automatsko serviranje svih fajlova preko:

```js
express.static(__dirname)
```

Umjesto toga, fajlovi se serviraju kontrolisano.

Javno dostupno:

- `/`
- `/index.html`
- `/style.css`
- `/login.js`
- `/auth/login`

Za admina zaštićeno:

- `/admin.html`
- `/banke.html`
- `/plate.html`
- `/script.js`
- `/banke.js`
- `/plate.js`
- postojeći API endpointi
- payroll endpointi
- IOPPD endpointi

Ako korisnik nije prijavljen:

- HTML stranice šalju na `/index.html`
- API vraća `401` i JSON odgovor

## Baze podataka

### Knjigovodstvena baza

Koristi se postojeća konfiguracija iz `.env`:

```text
CRM_SumSumarum
```

Tu se nalaze podaci za dashboard, naloge, firme, salda, kartice i slične knjigovodstvene preglede.

### Baza za plate

Dodana je posebna konekcija:

```text
LP_SumaSumarumm
```

Koristi se za plate, obračune i IOPPD.

Za plate se koristi samo aplikacija:

```text
IdApp = 29
```

Tabele koje počinju sa `ES1` su zanemarene jer ne predstavljaju tvoje radnike.

### Portal baza

Nova odvojena baza:

```text
Portal
```

Namjena:

- korisnici portala
- prava pristupa
- sesije
- veza korisnika sa firmama koje smije da vidi

Ova baza je odvojena od knjigovodstva i od plata, da se ne miješa sa postojećim podacima.

## Plate

Dodana je nova stranica:

```text
plate.html
```

Dodana je navigacija sa admin dashboarda prema platama.

Glavni naslov stranice je:

```text
Plate
```

Prva sekcija se zove:

```text
Pregled zarada
```

Moguće je izabrati firmu i prikazati obračune po mjesecima.

Za svaku firmu se prikazuju osnovni podaci:

- firma
- PIB
- broj radnika
- aktivni radnici
- broj obračuna

U pregledu po mjesecima prikazuju se:

- godina
- mjesec
- broj obračuna
- broj radnika
- neto
- bruto
- porez
- prirez
- doprinos zaposlenog
- doprinos poslodavca

Postoji dugme `Detalji` za detaljniji pregled obračuna.

## Kopiranje obračuna plata

Dodana je sekcija:

```text
Kopiranje obračuna
```

Sekcija je sakrivena dok se ne klikne dugme:

```text
Kopija obračuna
```

Funkcionalnost:

- izabere se više firmi
- izabere se mjesec i godina koji se koriste kao uzor
- izabere se novi mjesec i godina
- sistem provjeri šta će se kopirati
- zatim može da napravi kopiju obračuna

Ovo je napravljeno zato što nije uvijek zadnji mjesec najbolji uzor.

Primjer:

- za jun 2026 može se uzeti april 2026 kao uzor
- maj se može preskočiti ako je imao praznike, dodatke ili posebne obračune

Već je testirano na firmi `3 UP DOO`, gdje je obračun iz aprila 2026 kopiran u maj 2026.

## Provjera firmi bez obračuna

Dodana je sekcija u kojoj se unese godina i mjesec.

Sistem izlista firme koje nemaju obračun za taj mjesec.

Namjena:

- poslije masovnog kopiranja možeš odmah vidjeti koje firme još treba ručno odraditi

## IOPPD XML

Dodata je funkcionalnost za pravljenje IOPPD XML fajlova iz baze.

Dodana je sekcija:

```text
Download IOPPD-a
```

Unese se:

- godina
- mjesec

Sistem izlista firme koje imaju obračun za taj mjesec.

Pored svake firme postoji dugme:

```text
Download XML
```

Postoji i dugme:

```text
Skini sve IOPPD-e
```

Ono pokreće skidanje svih XML fajlova za firme koje imaju obračun.

## IOPPD pravila koja su obrađena

### Standardna zarada

Za obične zarade generišu se redovi na osnovu obračuna iz baze.

### Porez preko bruto limita

Za slučaj kao kod firme `FANCY BAR`, ako postoji porez kod zarade, porez se posebno prikazuje na šifri:

```text
97
```

To je usklađeno sa primjerom IOPPD fajla koji je ručno napravljen u programu.

### Više obračuna u istom mjesecu

Za slučaj kao kod firme `BEAUTY BY ROXY DOO`, gdje postoje plata i zakup u istom mjesecu, sistem uzima oba obračuna.

Zakup se prikazuje posebno, prema primjeru XML fajla.

### Zakup

Za zakup se koristi šifra:

```text
65
```

Kod zakupa:

- period je zadnji dan mjeseca
- ne računa se kao broj zaposlenih
- ne prikazuju se doprinosi kao kod zarada

## Cloudflare Tunnel

Aplikacija je podešena da radi na:

```text
localhost:8585
```

Cloudflare Tunnel je povezan na:

```text
http://localhost:8585
```

Kupljen je novi domen:

```text
knjigovodstvoonline.com
```

Domen je povezan sa tunelom i aplikacija je dostupna preko browsera spolja, bez otvaranja portova na ruteru.

## Port aplikacije

Port je promijenjen sa:

```text
3000
```

na:

```text
8585
```

U `script.js` su uklonjeni hardkodirani linkovi na `localhost:3000` i zamijenjeni relativnim rutama, da aplikacija radi i lokalno i preko domena.

## Admin korisnik

Napravljen je admin korisnik:

```text
admin
```

Lozinka je promijenjena naknadno po dogovoru.

Lozinka nije upisana u ovaj dokument kao običan tekst, jer ovaj fajl može završiti u git-u.

## Admin sekcija Korisnici

Na admin dashboard dodata je stavka menija:

```text
Korisnici
```

U toj sekciji admin može da kreira klijentske naloge.

Pri kreiranju se unosi:

- user
- pass
- firma

Korisnik se kreira sa rolom:

```text
user
```

Lozinka se upisuje kao `scrypt` hash, ne kao običan tekst.

Dodjela firme se upisuje u:

```text
dbo.ClientUserFirme
```

Tako svaki klijent može biti vezan za svoju firmu. Klijentske stranice koje budu napravljene kasnije treba da čitaju ovu vezu i prikazuju samo podatke firme koja je dodijeljena tom korisniku.

## Sljedeći koraci

Planirani sljedeći dio je klijentski portal.

Za obične korisnike treba napraviti:

- posebnu login logiku za korisnike sa `Role = 'user'`
- posebnu početnu stranicu poslije login-a
- ograničenje po firmama iz `ClientUserFirme`
- prikaz samo njihovih kartica
- prikaz samo njihovih kupaca
- prikaz samo njihovih dobavljača

Admin dio ostaje odvojen i zaključan samo za admin korisnika.
