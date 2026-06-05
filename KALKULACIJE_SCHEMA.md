# Kalkulacije u bazi

Kalkulacije se nalaze u tabeli `Dokument`.

## Glavni uslov

`VrstaDokumenta.Id = 1` predstavlja ulaznu kalkulaciju:

- `Naziv`: `Ulazna kalkulacija`
- `Oznaka`: `UF`
- `NazivUStampi`: `Kalkulacija`
- `KreirajKalkulaciju`: `true`
- `Ulaz`: `true`

Zato su kalkulacije svi dokumenti gdje je:

```sql
Dokument.IdVrstaDokumenta = 1
```

## Veze tabela

```text
Apps.Id = Dokument.IdApp

VrstaDokumenta.Id = Dokument.IdVrstaDokumenta
  za kalkulacije: VrstaDokumenta.Id = 1

Dokument.Id = StavkaDokumenta.IdDokument

Dokument.IdKomitent = Komitent.Id

StavkaDokumenta.IdArtikal = Artikal.Id

StavkaDokumenta.IdPdv = Nom_PDV.Id
```

## Primjer: sve kalkulacije za ONIX za 2026

```sql
SELECT
  d.Id,
  d.Rbr,
  d.Oznaka,
  d.DatumKreiranja,
  k.Naziv AS Dobavljac,
  k.Pib,
  COUNT(sd.Id) AS BrojStavki,
  SUM(sd.Ukupno) AS Ukupno
FROM dbo.Dokument d
JOIN dbo.Apps a ON a.Id = d.IdApp
LEFT JOIN dbo.Komitent k ON k.Id = d.IdKomitent
LEFT JOIN dbo.StavkaDokumenta sd ON sd.IdDokument = d.Id
WHERE a.ApUser = 'ONIX'
  AND a.Godina = 2026
  AND d.IdVrstaDokumenta = 1
GROUP BY d.Id, d.Rbr, d.Oznaka, d.DatumKreiranja, k.Naziv, k.Pib
ORDER BY d.Rbr DESC;
```

## Provjereno za ONIX

Broj kalkulacija po godinama:

- 2026: `231`
- 2025: `1596`
- 2024: `1846`
- 2023: `1106`

## Napomena

Gornji upit vraća zaglavlja kalkulacija sa zbirnim podacima.
Za prikaz pojedinačnih artikala treba listati `StavkaDokumenta` bez `GROUP BY`.

## Polja iz stavki kalkulacije

Glavna tabela za iznose po artiklima je `StavkaDokumenta`.

Najvaznija polja koja smo provjerili:

- `Kolicina` - kolicina artikla na kalkulaciji.
- `CijenaBezPDV` - nabavna cijena bez PDV-a po jedinici.
- `Cijena` - nabavna cijena sa PDV-om po jedinici.
- `RabatProcenat` - procenat rabata.
- `Rabat` - iznos rabata.
- `IdPdv` - PDV sifra/stavka iz PDV sifarnika.
- `Pdv` - PDV stopa na nabavnoj strani.
- `Ukupno` - nabavna vrijednost sa PDV-om za stavku. Ovo se trenutno sabira u koloni `Ukupno` na portalu.
- `PC` - prodajna cijena.
- `Marza` - marza/procenat razlike.
- `ProdajniPdv` - PDV stopa na prodajnoj strani.
- `IdProdajniPdv` - PDV sifra za prodajnu stranu.
- `VPC` - veleprodajna/prodajna cijena bez PDV-a.
- `ProdajnaVrijednost` - prodajna vrijednost stavke.
- `ProdajnaKolicina` - prodajna kolicina.
- `AkcizaFiksno` - fiksni iznos akcize, ako postoji.
- `AkcizaProcenat` - procenat akcize, ako postoji.
- `RabatSaAkcizom` - oznaka da li se rabat racuna sa akcizom.
- `RabatProcenatBezAkcize` - rabat procenat bez akcize.
- `Opis` - dodatni opis stavke.

## Primjer iz baze: ONIX kalkulacija 231

Kalkulacija:

- `Rbr`: `231`
- `Oznaka`: `BR-010626-1`
- `DatumKreiranja`: `01.06.2026`
- `Dobavljac`: `SIMSIC MONTMILK DOO`
- `BrojStavki`: `3`

Zbir po stavkama:

- `Kolicina`: `18`
- `Nabavna bez PDV`: `21,62` (`SUM(Kolicina * CijenaBezPDV)`)
- `Nabavna sa PDV`: `23,14` (`SUM(Ukupno)`)
- `Rabat`: `0,00`
- `Prodajna vrijednost`: `35,10` (`SUM(ProdajnaVrijednost)`)
- `Razlika prodajno/nabavno`: `11,96` (`SUM(ProdajnaVrijednost - Ukupno)`)
- `Prosjecna marza`: oko `51,64%`

Primjer jedne stavke:

```text
Artikal: Dijet. jogurt 1/1 l 0.5% m.m.
Kolicina: 6
Cijena bez PDV: 1,145
Cijena sa PDV: 1,2252
PDV: 7%
Ukupno nabavno: 7,3512
PC: 1,85
VPC: 1,729
Prodajna vrijednost: 11,10
Marza: 50,9958%
```
