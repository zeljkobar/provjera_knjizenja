# Pregled baze CRM_SumSumarum

Generisano: 5. 6. 2026. 20:56:38

Ovaj izvjestaj je nastao read-only citanjem SQL Server baze iz Node skripta `inspect-accounting-schema.js`.

## Sve tabele

| Tabela | Broj zapisa | Primarni kljuc |
| --- | --- | --- |
| __Migracija | 179 | - |
| Apps | 414 | Id |
| Artikal | 121.774 | Id |
| Artikal_Grupa | 68 | Id |
| Avans | 0 | Id |
| Banka | 19 | BankaId |
| Config | 34.416 | Id |
| Config_LP | 37 | Id |
| Depozit | 0 | Id |
| DnevniPromet | 1.649 | Id |
| Dokument | 17.509 | Id |
| Dokument_SemaKnjizenja | 28 | Id |
| Dokument_SemaKnjizenjaOld | 30 | - |
| Dokument_SemaKnjizenjaprenos | 2 | - |
| Dokument_SemaKnjizenjaStavke | 61 | Id |
| Dokument_SemaKnjizenjastavkePazar | 25 | - |
| Dokument_SemaKnjizenjastavkeprenos | 30 | - |
| DokumentAvans | 2 | Id |
| DokumentKnjiznoOdobrenje | 1 | Id |
| Fajl | 0 | Id |
| FajlDetalji | 0 | Id |
| FinIzv_Parametri | 1.034 | Id |
| FinIzv_Tip | 6 | Id |
| FinIzvjestaj | 1.184 | Id |
| FinIzvjestaj_Stavke | 108.842 | Id |
| Import_Fajl | 15.756 | Id |
| Import_Stavke | 151.270 | Id |
| Import_StavkeVeza | 0 | Id |
| Izvod | 26.511 | IzvodId |
| KIFKUFPodesavanja | 0 | - |
| KnjigaIU | 3.655 | Id |
| KnjigaIU_Stavke | 107.603 | Id |
| Komitent | 12.280 | Id |
| Komitent_Kontakt | 0 | Id |
| Komitent_Lokacija | 0 | Id |
| Komitent_Rabat | 0 | Id |
| Konto | 2.458 | Id |
| KontrolaVozaca | 0 | Id |
| Korisnik | 0 | Id |
| Materijalno_Artikal | 0 | Id |
| Materijalno_Grupa | 0 | Id |
| Materijalno_Nalog | 0 | Id |
| Materijalno_Stavka | 0 | Id |
| Materijalno_TipNaloga | 9 | Id |
| Nalog | 64.766 | Id |
| NalogBlagajna | 0 | Id |
| NalogBlagajnaStavke | 0 | Id |
| NalogStavke | 671.229 | Id |
| Narudzba | 0 | Id |
| NarudzbaRealizacija | 0 | Id |
| NarudzbaStavke | 0 | Id |
| Nivelacija | 0 | Id |
| Nivelacija_Stavke | 0 | Id |
| Nom_JedinicaMjere | 11 | Id |
| Nom_NacinPlacanja | 5 | Id |
| Nom_OJ | 5 | Id |
| Nom_PDV | 12 | Id |
| Nom_Radnik | 1 | Id |
| Nom_RJ | 239 | Id |
| Objekat | 0 | Id |
| OS_AmortizacionaGrupa | 13 | Id |
| OS_GrupaPoreskeAmortizacije | 5 | Id |
| OS_Lokacija | 0 | Id |
| OS_Obracun | 0 | Id |
| OS_ObracunStavka | 0 | Id |
| OS_OsnovnaSredstva | 0 | Id |
| OS_PoreskeGrupe | 97 | Id |
| OS_PoreskiObracun | 0 | Id |
| OS_PoreskiObracunStavka | 0 | Id |
| OS_TipAmortizacije | 5 | Id |
| OS_VrstaDokumenta | 11 | Id |
| OS_VrstaKonta | 1 | Id |
| Otpremnica | 0 | Id |
| Otpremnice_Brojevi | 0 | Id |
| PDVObrazac | 102 | Id |
| PDVObrazac_Stavke | 26 | Id |
| PDVObrazac_Zaglavlje | 2 | Id |
| prenosArtikal | 35.259 | - |
| prenosDnevniPromet | 981 | - |
| prenosknjigaiu_stavke | 60.945 | - |
| prenosNomPDV | 11 | - |
| prenosNovaStopaSemePazari | 3 | - |
| prenosNovaStopaSemeRobno | 4 | - |
| prenosNovaStopaTrosak | 3 | - |
| prenosPDVObrzac | 48 | - |
| Prodavac | 1 | Id |
| Proizvodnja | 0 | Id |
| PutniNalog | 0 | Id |
| PutniNalog_Relacija | 0 | Id |
| PutniNalog_Stavka | 0 | Id |
| PutniNalog_TipStavke | 0 | Id |
| rjprenos | 1.551 | - |
| StavkaDokumenta | 154.718 | Id |
| StavkaDokumentaProizvodnja | 0 | Id |
| StavkaIzvoda | 128.266 | StavkaIzvodaId |
| StavkaOtpremnice | 0 | Id |
| StavkaProizvodnje | 0 | Id |
| sysdiagrams | 1 | diagram_id |
| tmpDokument_SemaKnjizenja | 7 | - |
| tmpDokument_SemaKnjizenjaStavke | 13 | - |
| tmpfirma | 1.163 | - |
| tmpknjigaiu | 1.875 | - |
| tmpnalog | 181.204 | - |
| tmppromet | 1.384.806 | - |
| tmpZavisniTrosak_Kategorija | 7 | - |
| TrgovackaKnjiga | 16 | Id |
| UP_Dokument | 34 | Id |
| UP_Kategorija | 60 | Id |
| UP_Sablon | 0 | Id |
| UP_Uplatnica | 54 | Id |
| Veza_Analitika | 0 | Id |
| Veza_Komitent | 0 | Id |
| Veza_Komitent_Fiskalizacija | 2.529 | Id |
| Veza_Nalog | 0 | Id |
| VrstaBlagajne | 0 | Id |
| VrstaDokumenta | 19 | Id |
| VrstaDokumenta_SemaKnjizenja | 9 | Id |
| VrstaNaloga | 110 | Id |
| VrstaPutnogNaloga | 0 | Id |
| VrstaTroska | 9 | Id |
| VrstaTroska_Stavke | 50 | Id |
| ZavisniTrosak | 2 | Id |
| ZavisniTrosak_Kategorija | 2 | Id |
| ZiroRacun | 3.598 | Id |

## Najvaznije tabele za knjigovodstvo

| Tabela | Uloga |
| --- | --- |
| Apps | firma/godina rada; vecina knjigovodstvenih podataka je vezana na `Apps.Id` |
| Nalog | zaglavlje knjigovodstvenog naloga |
| NalogStavke | stavke knjigovodstvenog naloga; promet po kontima, komitentima i datumima |
| Konto | kontni plan |
| Komitent | kupci, dobavljaci i poslovni partneri |
| VrstaNaloga | sifarnik vrsta naloga: izvodi, izlazne fakture, pocetno stanje itd. |
| Dokument | zaglavlje materijalnih/robnih dokumenata, ukljucujuci kalkulacije |
| StavkaDokumenta | stavke dokumenata/kalkulacija po artiklima |
| VrstaDokumenta | sifarnik vrsta dokumenata; `Id = 1` je ulazna kalkulacija |
| Artikal | artikli/robe/usluge |
| Nom_RJ | radne jedinice/objekti/radnje |
| Nom_PDV | PDV sifarnik |

## Stvarni strani kljucevi koje baza deklarise

| FK | Tabela | Kolona | Vezana tabela | Vezana kolona |
| --- | --- | --- | --- | --- |
| FK__Artikal__IdApp__2042BE37 | Artikal | IdApp | Apps | Id |
| FK__Artikal__IdGrupa__4D5F7D71 | Artikal | IdGrupa | Artikal_Grupa | Id |
| FK__Artikal__IdJedin__4E53A1AA | Artikal | IdJedinicaMjere | Nom_JedinicaMjere | Id |
| FK_Artikal_Nom_PDV | Artikal | IdPdv | Nom_PDV | Id |
| FK__Artikal__IdProiz__08211BE3 | Artikal | IdProizvodjac | Artikal_Grupa | Id |
| FK__Artikal_G__IdApp__2136E270 | Artikal_Grupa | IdApp | Apps | Id |
| FK__Avans__IdAvans__3F865F66 | Avans | IdAvans | Dokument | Id |
| FK__Avans__IdDokumen__3E923B2D | Avans | IdDokument | Dokument | Id |
| FK__Banka__IdApp__2AC04CAA | Banka | IdApp | Apps | Id |
| FK__Banka__IdKonto__6C6E1476 | Banka | IdKonto | Konto | Id |
| FK__Config__IdApp__222B06A9 | Config | IdApp | Apps | Id |
| FK__Config_LP__IdApp__6AA5C795 | Config_LP | IdApp | Apps | Id |
| FK_Depozit_RJ | Depozit | Id_Objekat | Nom_RJ | Id |
| FK__Depozit__IdApp__39CD8610 | Depozit | IdApp | Apps | Id |
| FK__DnevniPro__IdApp__53584DE9 | DnevniPromet | IdApp | Apps | Id |
| FK_DnevniPromet_RJ | DnevniPromet | IdObjekat | Nom_RJ | Id |
| FK__Dokument__IdApp__353DDB1D | Dokument | IdApp | Apps | Id |
| FK__Dokument__IdConn__05C3D225 | Dokument | IdConnectedDocument | Dokument | Id |
| FK_Dokument_Komitent | Dokument | IdKomitent | Komitent | Id |
| FK_Dokument_NomNacinPlacanja | Dokument | IdNacinPlacanja | Nom_NacinPlacanja | Id |
| FK_Dokument_RJ | Dokument | IdObjekat | Nom_RJ | Id |
| FK_Dokument_Prodavac | Dokument | IdProdavac | Prodavac | Id |
| FK__Dokument__IdRadn__589C25F3 | Dokument | IdRadnik | Nom_Radnik | Id |
| FK__Dokument__IdVrst__46B27FE2 | Dokument | IdVrstaDokumenta | VrstaDokumenta | Id |
| FK__Dokument___IdApp__6576FE24 | Dokument_SemaKnjizenja | IdApp | Apps | Id |
| FK__Dokument___IdDok__68536ACF | Dokument_SemaKnjizenjaStavke | IdDokumentSemaKnjizenja | Dokument_SemaKnjizenja | Id |
| FK__Dokument___IdKon__69478F08 | Dokument_SemaKnjizenjaStavke | IdKonto | Konto | Id |
| FK__DokumentA__IdAva__08A03ED0 | DokumentAvans | IdAvans | Dokument | Id |
| FK__DokumentA__IdAva__416EA7D8 | DokumentAvans | IdAvans | Dokument | Id |
| FK__DokumentA__IdAva__4727812E | DokumentAvans | IdAvans | Dokument | Id |
| FK__DokumentA__IdDok__481BA567 | DokumentAvans | IdDokument | Dokument | Id |
| FK__DokumentA__IdDok__4262CC11 | DokumentAvans | IdDokument | Dokument | Id |
| FK__DokumentA__IdDok__09946309 | DokumentAvans | IdDokument | Dokument | Id |
| FK__DokumentK__IdDok__0C70CFB4 | DokumentKnjiznoOdobrenje | IdDokument | Dokument | Id |
| FK__DokumentK__IdDok__444B1483 | DokumentKnjiznoOdobrenje | IdDokument | Dokument | Id |
| FK__DokumentK__IdDok__4A03EDD9 | DokumentKnjiznoOdobrenje | IdDokument | Dokument | Id |
| FK__DokumentK__IdKnj__0D64F3ED | DokumentKnjiznoOdobrenje | IdKnjiznoOdobrenje | Dokument | Id |
| FK__DokumentK__IdKnj__453F38BC | DokumentKnjiznoOdobrenje | IdKnjiznoOdobrenje | Dokument | Id |
| FK__DokumentK__IdKnj__4AF81212 | DokumentKnjiznoOdobrenje | IdKnjiznoOdobrenje | Dokument | Id |
| FK__Fajl__IdApp__2CA8951C | Fajl | IdApp | Apps | Id |
| FK__FajlDetal__IdApp__40AF8DC9 | FajlDetalji | IdApp | Apps | Id |
| FK__FajlDetal__IdFaj__740F363E | FajlDetalji | IdFajl | Fajl | Id |
| FK__FinIzv_Pa__IdApp__26BAB19C | FinIzv_Parametri | IdApp | Apps | Id |
| FK__FinIzv_Ti__IdApp__1B33F057 | FinIzv_Tip | IdApp | Apps | Id |
| FK__FinIzvjes__IdApp__27AED5D5 | FinIzvjestaj | IdApp | Apps | Id |
| FK__Import_Fa__IdApp__3F51553C | Import_Fajl | IdApp | Apps | Id |
| FK__Import_St__IdApp__422DC1E7 | Import_Stavke | IdApp | Apps | Id |
| FK__Import_St__IdFaj__44160A59 | Import_Stavke | IdFajl | Import_Fajl | Id |
| FK__Import_St__IdApp__46F27704 | Import_StavkeVeza | IdApp | Apps | Id |
| FK__Izvod__BankaId__42E1EEFE | Izvod | BankaId | Banka | BankaId |
| FK__Izvod__IdApp__390E6C01 | Izvod | IdApp | Apps | Id |
| FK__Izvod__IdNalog__6D6238AF | Izvod | IdNalog | Nalog | Id |
| FK__KIFKUFPod__IdApp__3EC74557 | KIFKUFPodesavanja | IdApp | Apps | Id |
| FK__KnjigaIU__IdApp__74B941B4 | KnjigaIU | IdApp | Apps | Id |
| FK__KnjigaIU__IdNalo__7795AE5F | KnjigaIU | IdNalog | Nalog | Id |
| FK__KnjigaIU__IdObje__76A18A26 | KnjigaIU | IdObjekat | Nom_RJ | Id |
| FK__KnjigaIU__IdApp__3A02903A | KnjigaIU_Stavke | IdApp | Apps | Id |
| FK__KnjigaIU__IdDoku__2630A1B7 | KnjigaIU_Stavke | IdDokument | Dokument | Id |
| FK__KnjigaIU___IdKnj__75AD65ED | KnjigaIU_Stavke | IdKnjigaIU | KnjigaIU | Id |
| FK__KnjigaIU__IdKomi__2AF556D4 | KnjigaIU_Stavke | IdKomitent | Komitent | Id |
| FK__KnjigaIU__IdKont__2BE97B0D | KnjigaIU_Stavke | IdKonto | Konto | Id |
| FK__KnjigaIU__IdMate__2724C5F0 | KnjigaIU_Stavke | IdMaterijalniNalog | Materijalno_Nalog | Id |
| FK__KnjigaIU__IdNalo__2818EA29 | KnjigaIU_Stavke | IdNalog | Nalog | Id |
| FK__KnjigaIU__IdVrst__2A01329B | KnjigaIU_Stavke | IdVrstaNaloga | VrstaNaloga | Id |
| FK__KnjigaIU__IdVrst__290D0E62 | KnjigaIU_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__Komitent__IdApp__3AF6B473 | Komitent | IdApp | Apps | Id |
| FK__Komitent___IdKom__078C1F06 | Komitent_Kontakt | IdKomitent | Komitent | Id |
| FK__Komitent___IdLok__0880433F | Komitent_Kontakt | IdLokacija | Komitent_Lokacija | Id |
| FK_Komitent_Lokacija_Komitent | Komitent_Lokacija | IdKomitent | Komitent | Id |
| FK_Komitent_Lokacija_Prodavac | Komitent_Lokacija | IdProdavac | Prodavac | Id |
| FK_Komitent_Rabat_Artikal | Komitent_Rabat | IdArtikal | Artikal | Id |
| FK_Komitent_Rabat_Komitent | Komitent_Rabat | IdKomitent | Komitent | Id |
| FK__Komitent___IdKom__10566F31 | Komitent_Rabat | IdKomitentLokacija | Komitent_Lokacija | Id |
| FK__Konto__IdApp__3BEAD8AC | Konto | IdApp | Apps | Id |
| FK__KontrolaV__IdArt__7D439ABD | KontrolaVozaca | IdArtikal | Artikal | Id |
| FK__KontrolaV__IdPro__7C4F7684 | KontrolaVozaca | IdProdavac | Prodavac | Id |
| FK__Korisnik__IdApp__3CDEFCE5 | Korisnik | IdApp | Apps | Id |
| FK__Nalog__IdApp__3631FF56 | Nalog | IdApp | Apps | Id |
| FK__Uplata__IdDokume__06CD04F7 | Nalog | IdDokument | Dokument | Id |
| FK_Nalog_RJ | Nalog | IdObjekat | Nom_RJ | Id |
| FK__Nalog__IdOj__47A6A41B | Nalog | IdOj | Nom_OJ | Id |
| FK__Nalog__IdRj__46B27FE2 | Nalog | IdRj | Nom_RJ | Id |
| FK__Nalog__IdVrstaTr__25A691D2 | Nalog | IdVrstaTroska | VrstaTroska | Id |
| FK__NalogBlag__IdNal__4707859D | NalogBlagajna | IdNalog | Nalog | Id |
| FK__NalogBlag__IdVrs__451F3D2B | NalogBlagajna | IdVrstaNaloga | VrstaNaloga | Id |
| FK__NalogBlag__IdKom__4BCC3ABA | NalogBlagajnaStavke | IdKomitent | Komitent | Id |
| FK__NalogBlag__IdNal__49E3F248 | NalogBlagajnaStavke | IdNalogBlagajna | NalogBlagajna | Id |
| FK__NalogBlag__IdSta__4AD81681 | NalogBlagajnaStavke | IdStavkaBlagajne | VrstaBlagajne | Id |
| FK__UplataSta__IdKom__693CA210 | NalogStavke | IdKomitent | Komitent | Id |
| FK_NalogStavke_Konto | NalogStavke | IdKonto | Konto | Id |
| FK__UplataSta__IdUpl__68487DD7 | NalogStavke | IdNalog | Nalog | Id |
| FK__NalogStavk__IdRj__40257DE4 | NalogStavke | IdRj | Nom_RJ | Id |
| FK__Narudzba__IdApp__0A7378A9 | Narudzba | IdApp | Apps | Id |
| FK__Narudzba__IdApp__383A4359 | Narudzba | IdApp | Apps | Id |
| FK__Narudzba__IdKomi__088B3037 | Narudzba | IdKomitent | Komitent | Id |
| FK__Narudzba__IdKomi__392E6792 | Narudzba | IdKomitent | Komitent | Id |
| FK__Narudzba__IdNalo__2156DE01 | Narudzba | IdNalog | Nalog | Id |
| FK__Narudzba__IdNaru__097F5470 | Narudzba | IdNarudzbaRealizacija | NarudzbaRealizacija | Id |
| FK__Narudzba__IdNaru__3A228BCB | Narudzba | IdNarudzbaRealizacija | NarudzbaRealizacija | Id |
| FK__NarudzbaR__IdApp__02D256E1 | NarudzbaRealizacija | IdApp | Apps | Id |
| FK__NarudzbaR__IdApp__3651FAE7 | NarudzbaRealizacija | IdApp | Apps | Id |
| FK__NarudzbaS__IDArt__0E44098D | NarudzbaStavke | IDArtikal | Artikal | Id |
| FK__NarudzbaS__IDArt__3C0AD43D | NarudzbaStavke | IDArtikal | Artikal | Id |
| FK__NarudzbaS__IdNar__0D4FE554 | NarudzbaStavke | IdNarudzba | Narudzba | Id |
| FK__NarudzbaS__IdNar__3CFEF876 | NarudzbaStavke | IdNarudzba | Narudzba | Id |
| FK__Nivelacij__IdApp__3726238F | Nivelacija | IdApp | Apps | Id |
| FK__Nivelacij__IdArt__038683F8 | Nivelacija_Stavke | IdArtikal | Artikal | Id |
| FK__Nivelacij__IdNiv__02925FBF | Nivelacija_Stavke | IdNivelacija | Nivelacija | Id |
| FK__Nom_Jedin__IdApp__231F2AE2 | Nom_JedinicaMjere | IdApp | Apps | Id |
| FK__Nom_Nacin__IdApp__24134F1B | Nom_NacinPlacanja | IdApp | Apps | Id |
| FK__Nom_OJ__IdApp__25077354 | Nom_OJ | IdApp | Apps | Id |
| FK__Nom_PDV__IdApp__25FB978D | Nom_PDV | IdApp | Apps | Id |
| FK__Nom_Radni__IdApp__26EFBBC6 | Nom_Radnik | IdApp | Apps | Id |
| FK__Nom_RJ__IdApp__27E3DFFF | Nom_RJ | IdApp | Apps | Id |
| FK__Nom_RJ__IdOj__797DF6D1 | Nom_RJ | IdOj | Nom_OJ | Id |
| FK__Objekat__IdApp__28D80438 | Objekat | IdApp | Apps | Id |
| FK__OS_Amorti__IdApp__455F344D | OS_AmortizacionaGrupa | IdApp | Apps | Id |
| FK__OS_Amorti__IdTip__446B1014 | OS_AmortizacionaGrupa | IdTipAmortizacije | OS_TipAmortizacije | Id |
| FK__OS_Lokaci__IdApp__483BA0F8 | OS_Lokacija | IdApp | Apps | Id |
| FK__OS_Obracu__IdApp__6B84DD35 | OS_Obracun | IdApp | Apps | Id |
| FK__OS_Obracu__IdVrs__6A90B8FC | OS_Obracun | IdVrstaDokumenta | OS_VrstaDokumenta | Id |
| FK__OS_Obracu__IdObr__6E6149E0 | OS_ObracunStavka | IdObracun | OS_Obracun | Id |
| FK__OS_Obracu__IdOsn__6F556E19 | OS_ObracunStavka | IdOsnovnoSredstvo | OS_OsnovnaSredstva | Id |
| FK__OS_Osnovn__IdAmo__64D7DFA6 | OS_OsnovnaSredstva | IdAmortizacionaGrupa | OS_AmortizacionaGrupa | Id |
| FK__OS_Osnovn__IdApp__67B44C51 | OS_OsnovnaSredstva | IdApp | Apps | Id |
| FK__OS_Osnovn__IdKon__63E3BB6D | OS_OsnovnaSredstva | IdKonto | Konto | Id |
| FK__OS_Osnovn__IdPor__65CC03DF | OS_OsnovnaSredstva | IdPoreskaGrupa | OS_PoreskeGrupe | Id |
| FK__OS_Osnovn__IdTip__66C02818 | OS_OsnovnaSredstva | IdTipAmortizacije | OS_TipAmortizacije | Id |
| FK__OS_Poresk__IdApp__4DF47A4E | OS_PoreskeGrupe | IdApp | Apps | Id |
| FK__OS_Poresk__IdGru__4D005615 | OS_PoreskeGrupe | IdGrupaPA | OS_GrupaPoreskeAmortizacije | Id |
| FK__OS_Poresk__IdApp__7231DAC4 | OS_PoreskiObracun | IdApp | Apps | Id |
| FK__OS_Poresk__IdGru__76F68FE1 | OS_PoreskiObracunStavka | IdGrupaPoreskeAmortizacije | OS_GrupaPoreskeAmortizacije | Id |
| FK__OS_Poresk__IdOsn__77EAB41A | OS_PoreskiObracunStavka | IdOsnovnoSredstvo | OS_OsnovnaSredstva | Id |
| FK__OS_Poresk__IdPor__76026BA8 | OS_PoreskiObracunStavka | IdPoreskiObracun | OS_PoreskiObracun | Id |
| FK__OS_TipAmo__IdApp__3CC9EE4C | OS_TipAmortizacije | IdApp | Apps | Id |
| FK__OS_VrstaK__IdApp__418EA369 | OS_VrstaKonta | IdApp | Apps | Id |
| FK__Otpremnic__IdApp__381A47C8 | Otpremnica | IdApp | Apps | Id |
| FK_Otpremnica_Komitent | Otpremnica | IdKomitent | Komitent | Id |
| FK_Otpremnica_NomNacinPlacanja | Otpremnica | IdNacinPlacanja | Nom_NacinPlacanja | Id |
| FK_Otpremnica_RJ | Otpremnica | IdObjekat | Nom_RJ | Id |
| FK_Otpremnica_Prodavac | Otpremnica | IdProdavac | Prodavac | Id |
| FK_Otpremnice_Brojevi_Otpremnica | Otpremnice_Brojevi | IdOtpremnica | Otpremnica | Id |
| FK__Otpremnic__Id_Pr__0E6E26BF | Otpremnice_Brojevi | IdProdavac | Prodavac | Id |
| FK__PDVObraza__IdApp__3DD3211E | PDVObrazac | IdApp | Apps | Id |
| FK__PDVObraza__IdPDV__302F0D3D | PDVObrazac_Stavke | IdPDVObrazacZaglavlje | PDVObrazac_Zaglavlje | Id |
| FK__PDVObraza__IdApp__23C93658 | PDVObrazac_Zaglavlje | IdApp | Apps | Id |
| FK__PDVObraza__IdApp__2D52A092 | PDVObrazac_Zaglavlje | IdApp | Apps | Id |
| FK__Prodavac__IdApp__2BB470E3 | Prodavac | IdApp | Apps | Id |
| FK__Proizvodn__IdApp__6AFACD50 | Proizvodnja | IdApp | Apps | Id |
| FK__Proizvodn__IdApp__729BEF18 | Proizvodnja | IdApp | Apps | Id |
| FK__Proizvodn__IdArt__6BEEF189 | Proizvodnja | IdArtikal | Artikal | Id |
| FK__Proizvodn__IdArt__73901351 | Proizvodnja | IdArtikal | Artikal | Id |
| FK__Proizvodn__IdArt__6CE315C2 | Proizvodnja | IdArtikalSastojak | Artikal | Id |
| FK__Proizvodn__IdArt__7484378A | Proizvodnja | IdArtikalSastojak | Artikal | Id |
| FK__PutniNalo__IdRad__7993056A | PutniNalog | IdRadnik | Nom_Radnik | Id |
| FK_PutniNalog_PutniNalog_Relacija | PutniNalog | IdRelacija | PutniNalog_Relacija | Id |
| FK__PutniNalo__IdVrs__75C27486 | PutniNalog | IdVrstaPutnogNaloga | VrstaPutnogNaloga | Id |
| FK_PutniNalog_Stavka_PutniNalog | PutniNalog_Stavka | IdPutniNalog | PutniNalog | Id |
| FK_PutniNalog_Stavka_PutniNalog_TipStavke | PutniNalog_Stavka | IdTipStavke | PutniNalog_TipStavke | Id |
| FK__PutniNalo__IdKon__72E607DB | PutniNalog_TipStavke | IdKonto | Konto | Id |
| FK__StavkaDok__IdArt__7DCDAAA2 | StavkaDokumenta | IdArtikal | Artikal | Id |
| FK_StavkaDokumenta_Dokument | StavkaDokumenta | IdDokument | Dokument | Id |
| FK__StavkaDok__IdPro__18B6AB08 | StavkaDokumenta | IdProdajniPdv | Nom_PDV | Id |
| FK__StavkaDok__IdSta__5748DA5E | StavkaDokumenta | IdStavkaProizvodnje | StavkaProizvodnje | Id |
| FK__StavkaDok__IDArt__6FBF826D | StavkaDokumentaProizvodnja | IDArtikal | Artikal | Id |
| FK__StavkaDok__IDArt__766C7FFC | StavkaDokumentaProizvodnja | IDArtikal | Artikal | Id |
| FK__StavkaDok__IdSta__70B3A6A6 | StavkaDokumentaProizvodnja | IdStavkaDokumenta | StavkaDokumenta | Id |
| FK__StavkaDok__IdSta__7760A435 | StavkaDokumentaProizvodnja | IdStavkaDokumenta | StavkaDokumenta | Id |
| FK__StavkaIzv__Izvod__66B53B20 | StavkaIzvoda | IzvodId | Izvod | IzvodId |
| FK__StavkaIzv__Izvod__6B79F03D | StavkaIzvoda | IzvodId | Izvod | IzvodId |
| FK_StavkaOtpremnice_Otpremnica | StavkaOtpremnice | IdOtpremnica | Otpremnica | Id |
| FK__StavkaPro__IdArt__556091EC | StavkaProizvodnje | IdArtikal | Artikal | Id |
| FK__StavkaPro__IdDok__546C6DB3 | StavkaProizvodnje | IdDokument | Dokument | Id |
| FK__StavkaPro__IdPdv__5654B625 | StavkaProizvodnje | IdPdv | Nom_PDV | Id |
| FK__Trgovacka__IdApp__1B68FA81 | TrgovackaKnjiga | IdApp | Apps | Id |
| FK__UP_Dokume__IdApp__7CAF6937 | UP_Dokument | IdApp | Apps | Id |
| FK__UP_Sablon__IdKat__04508AFF | UP_Sablon | IdKategorijaUplatnice | UP_Kategorija | Id |
| FK__UP_Sablon__IdKom__0544AF38 | UP_Sablon | IdKomitent | Komitent | Id |
| FK__UP_Uplatn__IdDok__7F8BD5E2 | UP_Uplatnica | IdDokument | UP_Dokument | Id |
| FK__UP_Uplatn__IdKat__01741E54 | UP_Uplatnica | IdKategorijaUplatnice | UP_Kategorija | Id |
| FK__UP_Uplatn__IdKom__007FFA1B | UP_Uplatnica | IdKomitent | Komitent | Id |
| FK__Veza_Anal__IdApp__2D9CB955 | Veza_Analitika | IdApp | Apps | Id |
| FK__Veza_Anal__IdKom__76818E95 | Veza_Analitika | IdKomitent | Komitent | Id |
| FK__Veza_Anal__IdKon__74994623 | Veza_Analitika | IdKontoDugovno | Konto | Id |
| FK__Veza_Anal__IdKon__758D6A5C | Veza_Analitika | IdKontoPotrazno | Konto | Id |
| FK__Veza_Komi__IdApp__2E90DD8E | Veza_Komitent | IdApp | Apps | Id |
| FK__Veza_Komi__IdKom__5BCD9859 | Veza_Komitent | IdKomitent | Komitent | Id |
| FK__Veza_Komi__IdApp__2F8501C7 | Veza_Komitent_Fiskalizacija | IdApp | Apps | Id |
| FK__Veza_Komi__IdKom__2EC5E7B8 | Veza_Komitent_Fiskalizacija | IdKomitent | Komitent | Id |
| FK__Veza_Nalo__IdApp__30792600 | Veza_Nalog | IdApp | Apps | Id |
| FK__Veza_Nalo__IdVrs__3BB5CE82 | Veza_Nalog | IdVrstaNaloga | VrstaNaloga | Id |
| FK__Veza_Nalo__IdVrs__57FD0775 | Veza_Nalog | IdVrstaNaloga | VrstaNaloga | Id |
| FK__VrstaBlag__IdKon__2C538F61 | VrstaBlagajne | IdKonto | Konto | Id |
| FK__VrstaBlag__IdPro__2D47B39A | VrstaBlagajne | IdProtivKonto | Konto | Id |
| FK__VrstaDoku__IdApp__32616E72 | VrstaDokumenta | IdApp | Apps | Id |
| FK__VrstaDoku__IdVrs__15E52B55 | VrstaDokumenta | IdVrstaDokumentaVeza | VrstaDokumenta | Id |
| FK__VrstaDoku__IdApp__06D7F1EF | VrstaDokumenta_SemaKnjizenja | IdApp | Apps | Id |
| FK__VrstaDokum__IdOJ__04EFA97D | VrstaDokumenta_SemaKnjizenja | IdOJ | Nom_OJ | Id |
| FK__VrstaDokum__IdRj__05E3CDB6 | VrstaDokumenta_SemaKnjizenja | IdRj | Nom_RJ | Id |
| FK__VrstaDoku__IdSem__03FB8544 | VrstaDokumenta_SemaKnjizenja | IdSemaKnjizenja | Dokument_SemaKnjizenja | Id |
| FK__VrstaNalo__IdApp__335592AB | VrstaNaloga | IdApp | Apps | Id |
| FK__VrstaTros__IdApp__3449B6E4 | VrstaTroska | IdApp | Apps | Id |
| FK__VrstaTros__IdVrs__7BB05806 | VrstaTroska | IdVrstaNaloga | VrstaNaloga | Id |
| FK__VrstaTros__IdVrs__7CA47C3F | VrstaTroska | IdVrstaNaloga | VrstaNaloga | Id |
| FK__VrstaTros__IdVrs__7D98A078 | VrstaTroska | IdVrstaNaloga | VrstaNaloga | Id |
| FK__VrstaTros__IdKon__0169315C | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdKon__025D5595 | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdKon__035179CE | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdKon__04459E07 | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdKon__0539C240 | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdKon__00750D23 | VrstaTroska_Stavke | IdKonto | Konto | Id |
| FK__VrstaTros__IdVrs__062DE679 | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__VrstaTros__IdVrs__07220AB2 | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__VrstaTros__IdVrs__08162EEB | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__VrstaTros__IdVrs__090A5324 | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__VrstaTros__IdVrs__09FE775D | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__VrstaTros__IdVrs__0AF29B96 | VrstaTroska_Stavke | IdVrstaTroska | VrstaTroska | Id |
| FK__ZavisniTr__IdDok__255C790F | ZavisniTrosak | IdDokument | Dokument | Id |
| FK__ZavisniTr__IdKat__26509D48 | ZavisniTrosak | IdKategorija | ZavisniTrosak_Kategorija | Id |
| FK__ZavisniTr__IdKom__2744C181 | ZavisniTrosak | IdKomitent | Komitent | Id |
| FK__ZavisniTr__IdPdv__2838E5BA | ZavisniTrosak | IdPdv | Nom_PDV | Id |
| FK__ZavisniTr__IdSem__292D09F3 | ZavisniTrosak | IdSemaKnjizenjaRacuna | Dokument_SemaKnjizenja | Id |
| FK__ZavisniTr__IdApp__2097C3F2 | ZavisniTrosak_Kategorija | IdApp | Apps | Id |
| FK__ZavisniTr__IdKon__218BE82B | ZavisniTrosak_Kategorija | IdKonto | Konto | Id |
| FK__ZavisniTr__IdSem__22800C64 | ZavisniTrosak_Kategorija | IdSemaKnjizenjaRacuna | Dokument_SemaKnjizenja | Id |
| FK__ZiroRacun__IdApp__29CC2871 | ZiroRacun | IdApp | Apps | Id |
| FK__ZiroRacun__IdKom__75035A77 | ZiroRacun | IdKomitent | Komitent | Id |
| FK__ZiroRacun__IdKon__75F77EB0 | ZiroRacun | IdKontoDugovno | Konto | Id |
| FK__ZiroRacun__IdKon__76EBA2E9 | ZiroRacun | IdKontoPotrazno | Konto | Id |

## Pretpostavljene veze po kolonama `Id...`

| Tabela | Kolona | Vjerovatno pokazuje na | Napomena |
| --- | --- | --- | --- |
| Artikal | IdJedinicaMjere | Nom_JedinicaMjere | pretpostavka po nazivu kolone |
| Artikal | IdObjekat | Objekat | pretpostavka po nazivu kolone |
| Avans | IdDokument | Dokument | pretpostavka po nazivu kolone |
| Banka | IdKonto | Konto | pretpostavka po nazivu kolone |
| DnevniPromet | IdNalog | Nalog | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenja | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenja | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaOld | IdKonto | Konto | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaOld | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaOld | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaprenos | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaprenos | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaStavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaStavke | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjaStavke | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkePazar | IdKonto | Konto | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkePazar | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkePazar | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkeprenos | IdKonto | Konto | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkeprenos | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Dokument_SemaKnjizenjastavkeprenos | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Dokument | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Dokument | IdNacinPlacanja | Nom_NacinPlacanja | pretpostavka po nazivu kolone |
| Dokument | IdObjekat | Objekat | pretpostavka po nazivu kolone |
| Dokument | IdProdavac | Prodavac | pretpostavka po nazivu kolone |
| Dokument | IdRadnik | Nom_Radnik | pretpostavka po nazivu kolone |
| Dokument | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| DokumentAvans | IdDokument | Dokument | pretpostavka po nazivu kolone |
| DokumentKnjiznoOdobrenje | IdDokument | Dokument | pretpostavka po nazivu kolone |
| FajlDetalji | IdDokument | Dokument | pretpostavka po nazivu kolone |
| FajlDetalji | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| FajlDetalji | IdNalog | Nalog | pretpostavka po nazivu kolone |
| FajlDetalji | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| Import_StavkeVeza | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| Izvod | IdNalog | Nalog | pretpostavka po nazivu kolone |
| KIFKUFPodesavanja | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| KnjigaIU_Stavke | IdDokument | Dokument | pretpostavka po nazivu kolone |
| KnjigaIU_Stavke | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| KnjigaIU_Stavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| KnjigaIU_Stavke | IdNalog | Nalog | pretpostavka po nazivu kolone |
| KnjigaIU_Stavke | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| KnjigaIU | IdNalog | Nalog | pretpostavka po nazivu kolone |
| Komitent_Kontakt | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Komitent_Lokacija | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Komitent_Rabat | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| Komitent_Rabat | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| KontrolaVozaca | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| Materijalno_Artikal | IdKonto | Konto | pretpostavka po nazivu kolone |
| Materijalno_Nalog | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Materijalno_Nalog | IdRJ | Nom_RJ | pretpostavka po nazivu kolone |
| Materijalno_Stavka | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| Materijalno_Stavka | IdKonto | Konto | pretpostavka po nazivu kolone |
| Materijalno_TipNaloga | IdKonto | Konto | pretpostavka po nazivu kolone |
| Nalog | IdDokument | Dokument | pretpostavka po nazivu kolone |
| Nalog | IdObjekat | Objekat | pretpostavka po nazivu kolone |
| Nalog | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Nalog | IdVrstaTroska | VrstaTroska | pretpostavka po nazivu kolone |
| NalogBlagajna | IdNalog | Nalog | pretpostavka po nazivu kolone |
| NalogBlagajna | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| NalogBlagajnaStavke | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| NalogStavke | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| NalogStavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| NalogStavke | IdNalog | Nalog | pretpostavka po nazivu kolone |
| Narudzba | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Narudzba | IdNalog | Nalog | pretpostavka po nazivu kolone |
| Nivelacija_Stavke | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| OS_Obracun | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| OS_OsnovnaSredstva | IdKonto | Konto | pretpostavka po nazivu kolone |
| Otpremnica | IdDokument | Dokument | pretpostavka po nazivu kolone |
| Otpremnica | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| prenosDnevniPromet | IdNalog | Nalog | pretpostavka po nazivu kolone |
| prenosknjigaiu_stavke | IdDokument | Dokument | pretpostavka po nazivu kolone |
| prenosknjigaiu_stavke | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| prenosknjigaiu_stavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| prenosknjigaiu_stavke | IdNalog | Nalog | pretpostavka po nazivu kolone |
| prenosknjigaiu_stavke | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| Proizvodnja | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| PutniNalog_TipStavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| StavkaDokumenta | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| StavkaDokumenta | IdDokument | Dokument | pretpostavka po nazivu kolone |
| StavkaDokumenta | IdStavkaProizvodnje | StavkaProizvodnje | pretpostavka po nazivu kolone |
| StavkaDokumentaProizvodnja | IdStavkaDokumenta | StavkaDokumenta | pretpostavka po nazivu kolone |
| StavkaOtpremnice | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| StavkaProizvodnje | IdArtikal | Artikal | pretpostavka po nazivu kolone |
| StavkaProizvodnje | IdDokument | Dokument | pretpostavka po nazivu kolone |
| tmpDokument_SemaKnjizenja | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| tmpDokument_SemaKnjizenja | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| tmpDokument_SemaKnjizenjaStavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| tmpDokument_SemaKnjizenjaStavke | IdVrstaDokumenta | VrstaDokumenta | pretpostavka po nazivu kolone |
| tmpDokument_SemaKnjizenjaStavke | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| tmpknjigaiu | IdDokument | Dokument | pretpostavka po nazivu kolone |
| tmpknjigaiu | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| tmpknjigaiu | IdKonto | Konto | pretpostavka po nazivu kolone |
| tmpknjigaiu | IdNalog | Nalog | pretpostavka po nazivu kolone |
| tmpknjigaiu | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| tmppromet | IdNalog | Nalog | pretpostavka po nazivu kolone |
| tmpZavisniTrosak_Kategorija | IdKonto | Konto | pretpostavka po nazivu kolone |
| TrgovackaKnjiga | IdDokument | Dokument | pretpostavka po nazivu kolone |
| UP_Sablon | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| UP_Uplatnica | IdDokument | Dokument | pretpostavka po nazivu kolone |
| UP_Uplatnica | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Veza_Analitika | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Veza_Komitent_Fiskalizacija | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Veza_Komitent | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| Veza_Nalog | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| View_PregledNaloga | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| VrstaBlagajne | IdKonto | Konto | pretpostavka po nazivu kolone |
| VrstaTroska_Stavke | IdKonto | Konto | pretpostavka po nazivu kolone |
| VrstaTroska | IdVrstaNaloga | VrstaNaloga | pretpostavka po nazivu kolone |
| ZavisniTrosak_Kategorija | IdKonto | Konto | pretpostavka po nazivu kolone |
| ZavisniTrosak | IdDokument | Dokument | pretpostavka po nazivu kolone |
| ZavisniTrosak | IdKomitent | Komitent | pretpostavka po nazivu kolone |
| ZiroRacun | IdKomitent | Komitent | pretpostavka po nazivu kolone |

## Kolone vaznijih tabela

### Apps

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| ApUser | nvarchar(100) | NO |
| AppKey | nvarchar(1000) | YES |
| StartDate | datetime | NO |
| EndDate | datetime | YES |
| IsActive | bit | NO |
| Aktivan | int | NO |
| Migracija | int | NO |
| CompanyName | nvarchar(1000) | YES |
| CompanyAddress | nvarchar(1000) | YES |
| VATNumber | nvarchar(20) | YES |
| BusinessUnitCode | nvarchar(20) | YES |
| SoftwareCode | nvarchar(20) | YES |
| TCRCode | nvarchar(20) | YES |
| OperatorName | nvarchar(100) | YES |
| OperatorCode | nvarchar(20) | YES |
| Godina | int | NO |
| IdFirma | int | NO |

### Artikal

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Naziv | nvarchar(max) | NO |
| BarKod | nvarchar(100) | NO |
| Sifra | nvarchar(100) | NO |
| MPC | decimal(18,4) | NO |
| IdPdv | int | NO |
| IdGrupa | int | NO |
| IdJedinicaMjere | int | YES |
| NabavnaCijena | decimal(18,4) | NO |
| PC | decimal(18,4) | NO |
| VPC | decimal(18,4) | NO |
| JeUsluga | bit | YES |
| JeOsnovnoSredstvo | bit | NO |
| IdApp | int | NO |
| IdKey | int | NO |
| JeProizvodnja | bit | NO |
| PotvrdaOIspravnosti | bit | NO |
| IdObjekat | int | YES |
| AkcizaProcenat | decimal(18,4) | NO |
| AkcizaFiksno | decimal(18,4) | NO |
| IdProizvodjac | int | YES |

### Dokument

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | uniqueidentifier | NO |
| IdObjekat | int | NO |
| Rbr | int | NO |
| DatumKreiranja | datetime | NO |
| DatumValute | datetime | NO |
| IdKomitent | uniqueidentifier | YES |
| IdLokacijaKomitenta | uniqueidentifier | YES |
| IdNacinPlacanja | int | YES |
| Napomena | nvarchar(4000) | NO |
| IdProdavac | int | YES |
| IdVrstaDokumenta | int | NO |
| IdObjekat2 | int | YES |
| Oznaka | nvarchar(20) | YES |
| IdRadnik | int | YES |
| TCRCode | nvarchar(10) | YES |
| OperatorCode | nvarchar(10) | YES |
| IKOF | nvarchar(50) | YES |
| JIKR | nvarchar(50) | YES |
| FiscalTime | datetime | YES |
| ErrorCode | nvarchar(1000) | YES |
| ErrorMessage | nvarchar(max) | YES |
| Url | nvarchar(1000) | YES |
| IdConnectedDocument | uniqueidentifier | YES |
| NeKnjiziUGK | bit | NO |
| IdApp | int | NO |

### Komitent

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | uniqueidentifier | NO |
| Naziv | nvarchar(1000) | NO |
| Grad | nvarchar(100) | NO |
| Adresa | nvarchar(100) | NO |
| Pib | nvarchar(20) | NO |
| RegPdv | nvarchar(20) | NO |
| Banka | nvarchar(100) | NO |
| ZR | nvarchar(50) | NO |
| Email | nvarchar(100) | NO |
| TelFax | nvarchar(250) | NO |
| RabatProcenat | decimal(18,2) | NO |
| tempId | int | YES |
| KomitentId | int | NO |
| ZipCode | nvarchar(20) | NO |
| BrojDanaValute | int | NO |
| Fax | nvarchar(50) | YES |
| IdTipKomitenta | int | NO |
| IdApp | int | YES |
| IdMigracija | uniqueidentifier | YES |

### Konto

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Oznaka | nvarchar(20) | NO |
| Naziv | nvarchar(250) | NO |
| Sintetika | bit | NO |
| StariKonto | nvarchar(20) | YES |
| KontoImaAnalitiku | bit | NO |
| KoristiRJ | bit | NO |
| IdApp | int | YES |
| IdMigracija | int | YES |

### Nalog

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | uniqueidentifier | NO |
| Rbr | int | NO |
| Referenca | nvarchar(100) | NO |
| Datum | datetime | NO |
| Opis | nvarchar(1000) | YES |
| IdVrstaNaloga | int | YES |
| IdDokument | uniqueidentifier | YES |
| BrojDok | nvarchar(20) | YES |
| DatumFakture | datetime | YES |
| DatumValute | datetime | YES |
| IdRj | int | YES |
| IdOj | int | YES |
| Temeljnica | bit | NO |
| IdMaterijalniNalog | int | YES |
| IdVeza | uniqueidentifier | YES |
| IdTipVeze | int | YES |
| IdObjekat | int | YES |
| IdStavkaFajla | int | YES |
| IdVrstaTroska | int | YES |
| IdApp | int | NO |

### NalogStavke

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | uniqueidentifier | NO |
| IdNalog | uniqueidentifier | NO |
| IdKomitent | uniqueidentifier | YES |
| IdKonto | int | YES |
| OznakaKonta | nvarchar(20) | NO |
| Duguje | decimal(18,4) | NO |
| Potrazuje | decimal(18,4) | NO |
| Referenca | nvarchar(250) | NO |
| Opis | nvarchar(250) | YES |
| Rbr | int | NO |
| IdVeza | int | YES |
| Datum | datetime | NO |
| oldOznakaKonta | nvarchar(100) | YES |
| IdRj | int | YES |

### Nom_PDV

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Naziv | nvarchar(50) | NO |
| Iznos | decimal(18,2) | NO |
| Izuzece | nvarchar(20) | YES |
| IdApp | int | NO |
| IdKey | int | NO |

### Nom_RJ

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Naziv | nvarchar(50) | NO |
| Opis | nvarchar(250) | NO |
| IdVeza | int | YES |
| IdApp | int | YES |
| IdKey | int | YES |
| Oznaka | nvarchar(10) | NO |
| TCRCode | nvarchar(10) | YES |
| IdOj | int | YES |
| IdTipCijene | int | NO |

### StavkaDokumenta

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | uniqueidentifier | NO |
| IdDokument | uniqueidentifier | NO |
| Rbr | int | NO |
| IdArtikal | int | NO |
| Naziv | nvarchar(max) | NO |
| Kolicina | decimal(18,4) | NO |
| CijenaBezPDV | decimal(18,4) | NO |
| Cijena | decimal(18,4) | NO |
| RabatProcenat | decimal(18,4) | NO |
| Rabat | decimal(18,4) | NO |
| IdPdv | int | NO |
| Pdv | decimal(18,4) | NO |
| Ukupno | decimal(18,4) | NO |
| PC | decimal(18,4) | NO |
| Marza | decimal(18,4) | NO |
| ProdajniPdv | decimal(18,2) | NO |
| IdProdajniPdv | int | YES |
| VPC | decimal(18,4) | NO |
| ProdajnaVrijednost | decimal(18,2) | NO |
| ProdajnaKolicina | decimal(18,4) | NO |
| AkcizaFiksno | decimal(18,4) | NO |
| AkcizaProcenat | decimal(18,4) | NO |
| RabatSaAkcizom | bit | NO |
| RabatProcenatBezAkcize | decimal(18,4) | NO |
| Opis | nvarchar(1000) | YES |
| IdStavkaProizvodnje | uniqueidentifier | YES |

### VrstaDokumenta

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Naziv | nvarchar(50) | NO |
| Oznaka | nvarchar(20) | NO |
| Opis | nvarchar(1000) | NO |
| PrikaziUPrometu | bit | NO |
| Ulaz | bit | NO |
| TipCijene | int | NO |
| KreirajKalkulaciju | bit | NO |
| NazivUStampi | nvarchar(50) | NO |
| TipForme | int | NO |
| PovuciCijenuKomitenta | bit | NO |
| ObracunNabavneCijene | bit | NO |
| KoristiTemeljnicu | bit | NO |
| KnjiziDatumDokumenta | bit | NO |
| KnjiziDatumValute | bit | NO |
| IdApp | int | NO |
| IdMigracija | int | YES |
| KnjiziUKIF | bit | NO |
| KnjiziUKUF | bit | NO |
| Znak | int | NO |
| IdVrstaDokumentaVeza | int | YES |
| KnjiziUGK | bit | NO |

### VrstaNaloga

| Kolona | Tip | NULL |
| --- | --- | --- |
| Id | int | NO |
| Oznaka | nvarchar(50) | NO |
| Naziv | nvarchar(250) | NO |
| IdApp | int | YES |
| IdMigracija | int | YES |
| Konto | nvarchar(20) | YES |

## Stvarni zapisi i upotreba sifarnika

### Apps po godinama

| Godina | Broj firmi/aplikacija |
| --- | --- |
| 2026 | 51 |
| 2025 | 118 |
| 2024 | 127 |
| 2023 | 115 |
| 2022 | 2 |
| 2000 | 1 |

### Vrste dokumenata

| Id | Oznaka | Naziv | Naziv u stampi | Broj dokumenata |
| --- | --- | --- | --- | --- |
| 1 | UF | Ulazna kalkulacija | Kalkulacija | 16.872 |
| 4 | IF | Izlazna faktura | Racun / Otpremnica | 490 |
| 15 | AV | Avans | Avans | 135 |
| 5 | PD | Povrat dobavljacu | Povrat dobavljacu | 8 |
| 7 | PR | Profaktura | Profaktura | 3 |
| 16 | KO | Knjižno odobrenje | Knjižno odobrenje | 1 |
| 2 | IO | Interna otpremnica | Interna otpremnica | 0 |
| 3 | IP | Interna prijemnica | Interna prijemnica | 0 |
| 6 | PK | Povrat kupca | Povrat kupca | 0 |
| 8 | PO | Ponuda | Ponuda | 0 |
| 9 | PO | Popis | Popis | 0 |
| 10 | OT | Otpis | Otpis | 0 |
| 11 | PS | Pocetno stanje | Pocetno stanje | 0 |
| 12 | NA | Narudzba | Narudzba | 0 |
| 13 | RV | Revers | Revers | 0 |
| 14 | PV | Povrat reversa | Povrat reversa | 0 |
| 17 | IFV | Izlazna faktura VP | Izlazna faktura VP | 0 |
| 18 | FOD | Finansijsko odobrenje dobavljaca | Finansijsko odobrenje | 0 |
| 19 | IFF | Izlazna faktura koja je usla u traku | Racun / Otpremnica | 0 |

### Vrste naloga

| Id | Oznaka | Naziv | Broj naloga |
| --- | --- | --- | --- |
| 1 | KALK | Ulaz robe - kalkulacija MP | 16.485 |
| 45 | HIPO | Hipotekarna banka | 7.081 |
| 40 | CKB | CKB | 6.316 |
| 47 | 47 | Erste banka | 5.403 |
| 41 | NLB | NLB | 4.642 |
| 200 | LP | Licna Primanja | 4.150 |
| 44 | LOVB | Lovcen banka | 3.814 |
| 46 | PRVB | Prva banka | 2.925 |
| 99 | TROS | TROSKOVI | 2.647 |
| 70 | 70 | Obracun PDV-a | 1.886 |
| 600 | 600 | Pazar u MP | 1.653 |
| 42 | 42 | Addiko banka | 1.434 |
| 12 | IZL | Izlaz robe - Faktura - MP | 1.260 |
| 50 | CKBD | CKB devizni | 712 |
| 29 | 29 | Putni nalozi | 614 |
| 10 | ZIRB | Izvodi Ziraat Banka | 402 |
| 58 | 58 | Devizni erste | 388 |
| 400 | 0 | Pocetno stanje | 358 |
| 605 | ZK | ZAKLJUCNA KNJIZENJA | 346 |
| 26 | GOT | Blagajna | 226 |
| 11 | 11 | Ulaz robe - kalkulacija - MP | 217 |
| 601 | 74 | Devizni CKB - dolari | 195 |
| 612 | AB | Adriatic Banka | 171 |
| 55 | HIPD | Hipotekarna devizni | 166 |
| 604 | 91 | Osnovna sredstva | 141 |
| 603 | 31 | Primljeni Avansi | 136 |
| 609 | UNV | UNIVERSAL CAPITAL BANKA | 122 |
| 9 | 9 | OSTALO | 121 |
| 602 | 441 | Lovcen banka 2 | 113 |
| 65 | 65 | OBRACUN ZALIHA | 102 |
| 102 | 102 | NLB Klijentski rn | 72 |
| 51 | 51 | NLB devizni | 70 |
| 104 | LOVD | Devizni rn Lovcen banka | 67 |
| 80 | 80 | POS Terminal | 58 |
| 83 | 83 | Kompenzacije i cesije | 56 |
| 109 | 109 | Ispravke gresaka iz ranijih godina | 52 |
| 614 | ERD | ERSTE DEVIZNI DOLARI | 42 |
| 8 | 8 | Prenos robe | 19 |
| 30 | 30 | Kupci platili karticama | 19 |
| 111 | 111 | Lovcen banka 3 | 17 |
| 120 | 120 | Biznis kartica | 14 |
| 16 | 16 | povrat robe dobavljacu- MP | 8 |
| 610 | UND | DEVIZNI IZVODI UNIVERSAL CAPITAL | 7 |
| 501 | 501 | Kupci koji su usli u traku | 6 |
| 13 | 13 | Nivelacij cijene - MP | 5 |
| 613 | DAV | Dati Avansi | 4 |
| 69 | 69 | Zirat banka devizni ziro rn | 3 |
| 606 | 92 | Kursne razlike $ | 3 |
| 611 | pop | Dati popusti | 3 |
| 2 | 2 | Izlaz robe - Faktura VP | 2 |
| 25 | 25 | Fakturisanje usluga | 2 |
| 48 | 48 | Komercijalna banka Budva | 2 |
| 56 | 56 | Prva banka devizni | 2 |
| 17 | 17 | Interni prenos robe - MP | 1 |
| 27 | 27 | Razduzenje usluga u MP | 1 |
| 68 | 68 | Zirat banka - ziro racun | 1 |
| 81 | 81 | Izlazne fakture iz mp | 1 |
| 122 | 122 | Biznis kartica CKB | 1 |
| 502 | 502 | Knjizno odobrenje dobavljac | 1 |
| 607 | 86 | Kupoprodajni ugovor | 1 |
| 3 | 3 | Nivelacija cijene VP | 0 |
| 4 | 4 | Otpis robe VP | 0 |
| 5 | 5 | Povrat robe od kupca VP | 0 |
| 6 | 6 | Povrat robe dobavljacu VP | 0 |
| 7 | 7 | Interni prenos robe VP | 0 |
| 14 | 14 | Otpis robe - MP | 0 |
| 15 | 15 | Povrat robe od kupca - MP | 0 |
| 18 | 18 | Prodaja - MP | 0 |
| 19 | 19 | Visak - MP | 0 |
| 20 | 20 | Manjak - MP | 0 |
| 21 | 21 | Interni nalozi | 0 |
| 22 | 22 | Proizvodnja - Izlaz gotovi proizvodi | 0 |
| 23 | 23 | Interni prenos VP - Sirovine | 0 |
| 24 | 24 | Interni prenos iz zaliha gotovih proizvoda u malop | 0 |
| 28 | 28 | Ulaz sirovina | 0 |
| 43 | 43 | Atlas banka | 0 |
| 49 | 49 | Budva Podgoricka | 0 |
| 52 | 52 | Hypo alpe devizni | 0 |
| 53 | 53 | Atlas devizni | 0 |
| 54 | 54 | Podgoricka devizni | 0 |
| 57 | 57 | Hipotekarna banka 1 | 0 |
| 59 | 59 | NLB Visa Bussines | 0 |
| 60 | 60 | Atlas devizni 2 | 0 |
| 61 | 61 | Ziro rn Visa Komercijalna banka | 0 |
| 62 | 62 | Devizni rn Komercijalna banka | 0 |
| 63 | 63 | Devizni rn u inostranstvu Sparkasse | 0 |
| 64 | 64 | Devizni rn u inostranstvu | 0 |
| 66 | 66 | Izvodi - Podgoricka banka II | 0 |
| 67 | 67 | Nova Banka | 0 |
| 71 | 71 | CKB (Ex Podgoricka banka) | 0 |
| 72 | 72 | Devizni klijentski račun NLB | 0 |
| 73 | 73 | Hipotekarna banka I | 0 |
| 82 | 82 | Rasknjizenje uplate poreza i doprinosa | 0 |
| 84 | 84 | Izlazne fakture usle u traku | 0 |
| 85 | 85 | Izlazne fakture iz mp - Cvijetni centar | 0 |
| 90 | 90 | Zakupnina | 0 |
| 100 | 100 | Ziro racun Lovcen banka | 0 |
| 101 | 101 | CKB Klijentski rn | 0 |
| 103 | 103 | Podgoricka banka MAGNOLIJA | 0 |
| 105 | 105 | NLB ziro racun 2 | 0 |
| 106 | 106 | Hipotekarna klijentski - poslovni | 0 |
| 107 | 107 | Hipotekarna klijentski - devizni | 0 |
| 110 | 110 | Hipotekarna banka - Paff | 0 |
| 121 | 121 | Ulazi VP - rekapitulacija | 0 |
| 123 | 123 | CKB klijentski rn | 0 |
| 199 | TP | Tekuci promet | 0 |
| 301 | 301 | nalog testiranje | 0 |
| 530 | 530 | Nedefinisano | 0 |
| 608 | 124 | Knjizna odobrenja data kupcima | 0 |
| 615 | BLA | Blagajna | 0 |

### Nacini placanja na dokumentima

| Id | Naziv | Broj dokumenata |
| --- | --- | --- |
| 3 | Virman | 17.509 |
| 1 | Gotovinski | 0 |
| 2 | Platna kartica | 0 |
| 4 | Kredit | 0 |
| 5 | Reprezentacija | 0 |

### Konta po klasama

| Klasa | Broj konta |
| --- | --- |
| 0 | 238 |
| 1 | 107 |
| 2 | 306 |
| 3 | 92 |
| 4 | 550 |
| 5 | 668 |
| 6 | 217 |
| 7 | 24 |
| 8 | 45 |
| 9 | 211 |

## Kako bih modelovao novu racunovodstvenu bazu

Za novu bazu bih razdvojio knjigovodstvo, robno/materijalno i portal, ali bih ostavio jasne veze.

| Tabela | Namjena |
| --- | --- |
| Tenants/Firme | klijent/firma, PIB, naziv, adresa, status |
| FiscalYears | godina poslovanja po firmi |
| Users | korisnici portala i administratori |
| UserFirmAccess | koji korisnik vidi koju firmu |
| Partners | kupci/dobavljaci/komitenti |
| ChartOfAccounts | kontni plan |
| JournalTypes | vrste naloga |
| Journals | zaglavlje naloga |
| JournalLines | stavke naloga sa kontom, komitentom, duguje/potrazuje |
| Banks | banke i racuni |
| BankStatements | izvodi banaka |
| DocumentTypes | vrste dokumenata: kalkulacija, faktura, otpremnica... |
| Documents | zaglavlje dokumenata |
| DocumentLines | stavke dokumenata |
| Items | artikli/usluge |
| Warehouses/Stores | radnje, magacini, objekti |
| VatRates | PDV stope |
| PayrollCompanies | firme u modulu plata |
| Employees | radnici |
| PayrollRuns | obracuni plata |
| PayrollRunLines | stavke obracuna po radniku |
| AuditLog | ko je sta uradio i kada |

Najvaznije pravilo: sve transakcione tabele moraju imati `FirmId`, `FiscalYearId`, datume, status, i jasne strane kljuceve. GUID bih koristio za javne/vanjske ID-jeve, a numericki `identity/bigint` za interne kljuceve gdje performanse znace vise.
