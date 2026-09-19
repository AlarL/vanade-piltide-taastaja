# Tasuta fotod ja Stripe’i videopakett

Koostatud: 17.09.2026. Aluseks on 16.09.2026 vestluses koostatud plaan, praeguse projekti kood ja allpool viidatud ametlikud juhendid.

**Staatus: arendusplaan. Makseid, pilveteenuseid ega videogenereerimist pole selle dokumendi koostamisega sisse lülitatud.**

See on omaniku ja arendaja eestikeelne juhend. Arendusagendi tehniline tööülesanne asub failis [AGENT-IMPLEMENTATION.md](AGENT-IMPLEMENTATION.md).

## 1. Mida me ehitame?

Fotode taastamine jääb tasuta. Kohvi ostmise kaart asendub võimalusega osta taastatud fotode animeerimiseks kolm videokorda ühe maksega. Külastaja ei loo kasutajakontot ega sõlmi tellimust.

| Küsimus | Esimese versiooni lahendus |
|---|---|
| Tasuta fotod | Kuni 5 fotot jooksva 24 tunni jooksul brauserisessiooni kohta |
| Videopakett | 3 videot, kavandatud lõpphind 2,99 € |
| Video | 8 sekundit, 720p, Veo 3.1 Lite |
| Kasutamine | Sama foto eri liigutused või eri fotod |
| Kehtivus | Iga pakett 30 päeva makse esmasest kinnitamisest |
| Konto | Pole vajalik; ost seotakse sama brauseriga turvalise küpsise kaudu |
| Ebaõnnestumine | Tehnilise vea või turvafiltri tõttu valmimata video ei kuluta korda |
| Uuesti genereerimine | Iga uus edukas video kulutab uue korra |
| Allalaadimine | Korduvalt 1 tunni jooksul rakenduses registreeritud valmimisest |
| Galerii | Püsivat videogaleriid ei lisata; video tuleb seadmesse salvestada |

2,99 € on plaani hinnavalik. Enne müügi avamist kinnita, et see sobib tegeliku kulu ja sinu maksuseadistusega. Paketi kehtivus ei pikene järgmise ostuga. Süsteem kasutab esmalt varem aeguvaid kordi.

„Sessioonipõhine” tähendab siin püsivat anonüümset brauseritunnust: akna sulgemine ei kaota ostu. Küpsiste kustutamine, privaatrežiimi lõpetamine, teine brauser või teine seade võivad ligipääsu kaotada. Automaatset ostu taastamist e-posti teel esimesse versiooni ei tule.

## 2. Mis on praegu olemas?

17.09.2026 kontrollitud koodis:

- Rakendus kasutab Reacti, Vite’i, TypeScripti ja Expressi. Arendusserveri vaikeport on `3001`.
- Fotode taastamine kasutab Gemini API-t. Senine limiidiloendur asub serveri ajutises `Map`-is ja sõltub brauseri saadetud `x-client-id` väärtusest.
- Veo käivitamise, olekukontrolli ja allalaadimise kood on `server.ts` failis olemas. Käivitamise liides tagastab praegu kohe peatamise teate.
- `VideoAnimator.tsx` näitab peatamise teadet. Kohvi kaart on endiselt tulemuse vaates.
- Stripe’i, Firestore’i ja Cloud Tasksi ühendusi praeguses sõltuvuste loendis ei ole.
- Vana videokood arvestab kasutuskorda allalaadimisel ja sisaldab kallimale mudelile üleminekut. Tasulise teenuse puhul tuleb mõlemad ümber teha.
- Kohalikud muudatused failides `server.ts`, `src/App.tsx` ja `src/components/PhotoUploader.tsx` tuleb säilitada.

Google Cloud Run on varasema plaani majutuseeldus. Selle koostamisel ei kontrollitud sinu Google’i kontot ega tegelikku avaldatud teenuse seadistust.

## 3. Kuidas külastaja seda kasutab?

1. Ta taastab foto tasuta.
2. Tulemuse all näeb pakkumist „Anna fotole elu — 3 videot / 2,99 €” ja valib liigutuse.
3. Rakendus säilitab foto ajutiselt selles brauseris ja avab samas aknas Stripe’i makselehe.
4. Pärast makset taastatakse foto ning kontrollitakse serverist ostu kinnitust.
5. Kui kinnitus viibib, kuvatakse „Kontrollime makset”. Külastajat ei suunata kohe teist korda maksma.
6. Kui ost on kinnitatud, näeb ta „Sul on 3 videokorda” ja vajutab „Loo video — kasutab 1 korra”. Makse ise videot automaatselt ei käivita.
7. Üks kord reserveeritakse töö ajaks. Valmimisel see kulub; kinnitatud vea korral vabastatakse.
8. Valmis video saab tunni jooksul uuesti alla laadida. Näidatakse ka allesjäänud kordade arvu ja aegumist.

Makse tühistamine jätab foto alles. Kui brauseris ajutine salvestamine või vajalikud küpsised ei tööta, näitab rakendus seda enne maksele suunamist.

Esimeses versioonis pakume fikseeritud liigutusi, näiteks naeratus, pilkkontakt ja mahe tuul. Kõne ja huulte sünkroonimise valik jäetakse välja. Mudel võib väljastada heliriba; kasutajale ei lubata kindlat kõnet ega täiesti helitut faili. Fotode sobivust piiravad teenusepakkuja filtrid, seega ei lubata, et iga vana foto on animeeritav.

## 4. Kes mida teeb?

| Töö | Sinu osa | Arendaja või agendi osa |
|---|---|---|
| Hind ja pakkumine | Kinnitad lõpphinna, kehtivuse ja müüja andmed | Rakendab need serveris ja vaadetes |
| Stripe | Lood/valid konto, seadistad ettevõtte, väljamaksed ja toote | Ühendab Checkouti, maksekinnitused ja ostuarvestuse |
| Võtmed | Lisad saladused teenuse turvalisse seadistusse | Annab täpsed muutujanimed ja kontrollib ühendust võtmeid kuvamata |
| Google Cloud | Valid projekti, lubad vajalikud teenused ja arvelduse | Seadistab andmemudeli, töötluse, õigused ja juurutuse |
| Tingimused | Kinnitad müügi-, maksu-, privaatsus- ja klienditoe korralduse | Uuendab tekste vastavalt tegelikule toimimisele |
| Kontroll | Proovid ostu ja video kasutamist kasutajana | Teeb automaattestid, korduspäringute ja restartide kontrolli |
| Avaldamine | Kinnitad müügi avamise | Avaldab kontrollitud versiooni ja avab müügilipu |

## 5. Sinu Stripe’i seadistused

### 5.1. Alusta testkeskkonnast

Ava [Stripe Dashboard](https://dashboard.stripe.com/) ja vali konto testkeskkond ehk sandbox. Sisesta konto aktiveerimiseks vajalikud ettevõtte-, esindaja- ja väljamakseandmed Stripe’i enda vaadetes. Katsetamisel kasutatakse testmakseid.

Test- ja päriskeskkonnal on erinevad võtmed ning objektid. Testtoote `price_...` tunnus ei muutu päriskeskkonna tunnuseks võtme vahetamisega. [Stripe’i keskkondade ja võtmete juhend](https://docs.stripe.com/keys).

### 5.2. Loo videopakett

Menüütee: **More → Product catalog → + Add product**. Sisesta:

| Väli | Väärtus |
|---|---|
| Name | Anna fotole elu — 3 videot |
| Description | Kolm 8-sekundilist videot taastatud fotodest. Kehtib 30 päeva samas brauseris. |
| Hind | 2,99 |
| Valuuta | EUR |
| Hinnatüüp | Flat-rate, One time |
| Kogus rakenduse makses | 1 pakett |

Salvesta toode ning anna arendajale **Price ID** kujul `price_...`. `prod_...` on toote tunnus ja ei asenda hinna tunnust. Kolm videot kirjeldab meie paketi sisu; Checkoutis ostetakse üks pakett. [Toote ja hinna loomise juhend](https://docs.stripe.com/products-prices/manage-prices).

Lõpphind peab vastama saidil näidatule. Maksude arvestamise viis tuleb enne avaldamist sinu ettevõtte olukorra järgi kinnitada. Arendaja ei lisa automaatselt hinnale maksu ega lülita tasulist maksutoodet vaikimisi sisse. Allahindlusi ja muudetavat kogust esimesse versiooni ei lisata.

### 5.3. Lisa serveri API võti

Ava Stripe’i **API keys** vaade: [võtmete leht](https://dashboard.stripe.com/apikeys). Arendaja täpsustab rakenduse vajalike õigustega serverivõtme; võimalusel kasutatakse piiratud õigustega võtit. Muutuja nimi on `STRIPE_SECRET_KEY`, sõltumata sellest, kas väärtus algab `rk_` või `sk_`.

Salvesta võti Google Secret Managerisse või kohaliku arenduse `.env` faili. Võtit ei panda Markdown-faili, Git-repositooriumi, brauserikoodi ega vestlusesse. Stripe’i veebimakselehele suunamiseks ei vaja see lahendus eraldi brauseri `pk_...` võtit. [Stripe’i võtmete juhend](https://docs.stripe.com/keys).

### 5.4. Seadista maksete tagasiside ehk webhook

Tee see siis, kui arendaja on vastava serveriliidese avaldanud.

1. Ava **Workbench → Webhooks → Create an event destination**.
2. Vali **Your account**, arendajaga kooskõlastatud API versioon ja allolevad sündmused.
3. Vali **Webhook endpoint**.
4. Sisesta `https://<rakenduse-domeen>/api/stripe/webhook`.
5. Salvesta ja lisa selle sihtkoha `whsec_...` saladus muutujasse `STRIPE_WEBHOOK_SECRET`.

Makse sündmused: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`.

Tagasimakse ja vaidlustuse sündmused: `charge.refunded`, `refund.created`, `refund.updated`, `refund.failed`, `charge.dispute.created`, `charge.dispute.closed`.

Arendaja registreerib sama nimekirja koodis. Test- ja päriskeskkonna webhook tuleb seadistada eraldi. Kohaliku Stripe CLI kuulaja saladus erineb Dashboardi sihtkoha saladusest. [Webhooki seadistamise juhend](https://docs.stripe.com/webhooks).

### 5.5. Kontrolli testostu

Arendaja annab testversiooni aadressi. Taasta foto, vajuta ostunuppu ja kasuta Stripe’i testkaarti `4242 4242 4242 4242`, tulevast aegumiskuupäeva ja test-CVC-d. Seejärel kontrolli, et rakendus näitab kolme videokorda. Testkaarti kasutatakse ainult testkeskkonnas. [Stripe’i testimise juhend](https://docs.stripe.com/testing).

Stripe’i testmakse ei tee Google’i videopäringut tasuta. Esimesed arendustestid kasutavad video jäljendust. Pärisvideot kontrollitakse hiljem piiratud mahus, kui Google’i arveldus ja ligipääs on seadistatud.

### 5.6. Üleminek pärismaksetele

Pärast testide läbimist loo või kopeeri toode live-keskkonda, võta selle päris Price ID, lisa live-serverivõti ja loo live-webhook. Kontrolli väljamaksekontot, saidi aadressi, klienditoe kontakte ja ostjale kuvatavat ettevõttenime. Arendaja kontrollib keskkondade vastavust ning avab müügi eraldi funktsioonilipuga.

## 6. Sinu Google Cloudi seadistused

### 6.1. Projekt, arveldus ja mudel

Vali [Google Cloud Console’is](https://console.cloud.google.com/) rakenduse projekt. Pane kirja projekti ID, olemasoleva Cloud Runi teenuse nimi ja piirkond. Kinnita Google AI Studio/Gemini võtme seos soovitud arveldusega projektiga; kontrolli Veo kasutusõigust ja kvooti selles projektis.

Veo 3.1 Lite on hinnakirjas tasuline mudel. Selle projekti fotode töötamine ei tõesta veel videote kättesaadavust. Arendaja kontrollib konkreetset mudelit `veo-3.1-lite-generate-preview` enne müügi avamist. [Google’i hinnakiri](https://ai.google.dev/gemini-api/docs/pricing).

### 6.2. Püsiv andmebaas

Menüütee: **Firestore → Create database**. Vali **Native mode**, andmebaas `(default)` ja rakendusele sobiv piirkond; kooskõlasta asukoht arendajaga enne loomist. Firestore’is hakkavad olema ostud, videokorrad, sessioonid ja tööde olekud, mitte fotode sisu. Brauserile otsest andmebaasi ligipääsu ei anta. [Firestore’i serverirakenduse juhend](https://docs.cloud.google.com/firestore/native/docs/create-database-server-client-library).

### 6.3. Taustatööde teenused

Arendaja seadistab järgmised komponendid sinu valitud projektis:

| Komponent | Miks seda vaja on? |
|---|---|
| Avalik Cloud Runi veebiteenus | Veebileht, makse alustamine ja Stripe’i webhook |
| Privaatne Cloud Runi töötlusteenus | Video valmimise kontroll; internetikülastaja seda otse ei käivita |
| Cloud Tasks, järjekord `video-jobs` | Korduv olekukontroll ka siis, kui kasutaja sulgeb brauseri |
| Cloud Scheduler | Kontrollib perioodiliselt, et ükski töö või järjekorrateavitus pole kadunud |
| Secret Manager | Gemini ja Stripe’i võtmed ning webhooki saladus |
| Teenusekontod ja IAM | Iga teenuse jaoks ainult vajalikud õigused |

Cloud Scheduler on siin töökindluse täpsustus: andmebaasi salvestuse ja järjekorda lisamise vahele võib sattuda restart. Taastuskontroll peab sellised tööd üles leidma. Google’i enda juhendid: [Cloud Run ja Cloud Tasks](https://docs.cloud.google.com/run/docs/triggering/using-tasks), [saladuste kasutamine Cloud Runis](https://docs.cloud.google.com/run/docs/configuring/services/secrets).

Sina annad projekti ja juurdepääsu; arendaja valmistab täpsed õigused, juurutuskäsud ja piirkonnad ette. Kasutame Cloud Runi teenuseidentiteeti, mitte repositooriumi lisatud Google’i teenusekonto võtmefaili.

### 6.4. Arendajale vajalikud väärtused

| Nimi | Sisu / kust saad |
|---|---|
| `APP_URL` | Avaliku rakenduse HTTPS-aadress; testis testaadress |
| `GEMINI_API_KEY` | Olemasolev või projekti jaoks loodud serverivõti, salajasena |
| `STRIPE_SECRET_KEY` | Stripe’i serverivõti, salajasena |
| `STRIPE_WEBHOOK_SECRET` | Vastava keskkonna webhooki saladus |
| `STRIPE_VIDEO_PRICE_ID` | Vastava keskkonna videopaketi `price_...` |
| `GOOGLE_CLOUD_PROJECT` | Google Cloudi projekti ID |
| `FIRESTORE_DATABASE_ID` | Tavaliselt `(default)` |
| `TASKS_LOCATION` | Arendajaga valitud Cloud Tasksi piirkond |
| `TASKS_QUEUE` | `video-jobs` |
| `VIDEO_WORKER_URL` | Privaatse töötlusteenuse aadress |
| `TASKS_INVOKER_SERVICE_ACCOUNT` | Arendaja loodud ülesannete kutsuja teenusekonto |

Ülejäänud tehnilised muutujad, sealhulgas test-/pärisrežiim ja müügilipud, on agendi juhendis. Arendaja lisab tulevase teostuse käigus `.env.example` faili ainult näidisväärtused.

Seadista Cloud Billingus eelarveteavitused. Need on hoiatused; rakenduse päringupiirangud ja müügi peatamise võimalus tuleb arendajal eraldi rakendada. Kõigi kulude hulka kuuluvad ka tasuta fotode päringud.

## 7. Hinnastuse lähtearvutus

17.09.2026 ametlikust hinnakirjast kontrollitud Veo 3.1 Lite 720p hind on **0,05 USD sekundis**. Seega üks 8-sekundiline video on 0,40 USD ning kolm videot 1,20 USD. [Google’i hinnakiri](https://ai.google.dev/gemini-api/docs/pricing).

Stripe’i Eesti hinnakirjas on standardse EMP kaardi tasu **1,5% + 0,25 €**: 2,99 € makse puhul ligikaudu 0,295 €. Muud kaardid ja valuutavahetus võivad maksta rohkem. [Stripe’i Eesti hinnakiri](https://stripe.com/en-ee/pricing).

Paketi tasuvust arvuta nii:

```text
2,99 €
− Stripe’i tegelik tasu
− 1,20 USD eurodes tegeliku arvestuskursiga
− müügiga seotud maksud
− andmebaasi, taustatööde, serveri ja andmeside kulu
− tasuta fotode ning võimalike hüvitiste osa
= ligikaudne panus teenuse ülalpidamisse
```

See ei ole garanteeritud kasumiarvutus. Enne avaldamist vaata tegelikku testkulu. Kallimale Veo Standard-mudelile automaatset üleminekut ei lubata.

## 8. Klienditugi, tingimused ja säilitamine

Enne makset peab külastaja nägema hinda, kolme korra sisu, 30-päevast kehtivust, sama brauseri piirangut, tunni pikkust allalaadimisvõimalust ja ebaõnnestumise käsitlust.

Privaatsustekst peab kirjeldama tegelikku lahendust:

- Foto säilib maksele suunamise ajaks brauseri IndexedDB-s kuni 24 tundi. Aegunud fotot ei kasutata ning see kustutatakse järgmisel rakenduse avamisel; suletud brauseris ei saa rakendus taimeriga kustutamist garanteerida.
- Meie server ei salvesta fotosid ega videofaile püsivasse failihoidlasse. Maksete ja tööde metaandmed säilivad andmebaasis.
- Google’i dokumentatsioon kirjeldab loodud videote säilitamist kaks päeva. Meie tunni pikkune allalaadimisaken on teenuse kasutusreegel, mitte lubadus Google’i koopia kustutamiseks. [Veo säilitamise juhend](https://ai.google.dev/gemini-api/docs/veo).
- Ostu tõendavate andmete ja tehniliste logide säilitustähtajad määratakse eraldi. Paketi aegumine ei tähenda raamatupidamisandmete kustutamist.

Senine üldine lubadus, et kõike kustutatakse kohe ning midagi ei säilitata, vajab seega muutmist. Ära nimeta mudeli filtrit automaatselt õiguslikuks keeluks; kasutajale piisab selgitusest, et selle fotoga video ei valminud ja kasutuskord vabastati.

Ostu taastamisel kontrollib klienditugi Stripe’is makset ja ostu kuuluvust. Ainult e-posti aadressi või ostunumbri teadmine ei anna õigust videokordade ülevõtmiseks. Arendaja valmistab kontrollitud ja logitava taastamistoimingu, mis viib ostu uude sessiooni ning eemaldab vana sessiooni ligipääsu.

Rahalised tagasimaksed algatab omanik Stripe Dashboardist. Esimene versioon automatiseerib täieliku tagasimakse järel kasutamata õiguste eemaldamise. Osaline tagasimakse suunatakse käsitsi lahendamisele; sama ostu uute videote kasutamine peatatakse ajutiselt. Vaidlustuse korral peatatakse selle ostu kasutamata õigused. See tehniline arvestus ei määra iseseisvalt kliendi rahalisi õigusi. [Stripe’i tagasimaksete juhend](https://docs.stripe.com/refunds).

## 9. Arenduse etapid ja valmimise tunnused

| Etapp | Tulemus, mida kontrollida |
|---|---|
| 1. Sessioon ja arvestus | Restart ei kaota ostu; üks külastaja ei näe teise õigusi |
| 2. Stripe testkeskkonnas | Üks tasutud ost annab täpselt kolm korda, ka korduva teavituse korral |
| 3. Videotööd | Üks aktiivne töö korraga; viga vabastab korra; restart ei käivita topeltvideot |
| 4. Kasutajaliides | Foto säilib makse ajal, mobiilivaade töötab, kohvikaart kaob |
| 5. Tingimused ja klienditugi | Ostueelne info ja säilitustekstid vastavad rakendusele |
| 6. Testimine ja avaldamine | Testmakse, kontrollitud pärisvideo ja piiratud avaldamine läbivad kontrolli |

Arendaja esitab eraldi tulemused kohalike kontrollide, avaldatud testkeskkonna ja pärisvideo kohta. Ainult õnnestunud ehitamine ei tõesta maksete või taustatööde toimimist.

## 10. Sinu kontrollnimekiri enne müügi avamist

- [ ] Müüja, klienditoe ja väljamaksete andmed on õiged.
- [ ] Paketi hind, maksuseadistus ja tingimused on kinnitatud.
- [ ] Stripe’i testost lisab täpselt kolm videokorda.
- [ ] Makse katkestamine ja hilinenud kinnitus ei tekita topeltostu.
- [ ] Brauseri värskendamine ja serveri restart ei kaota ostetud kordi.
- [ ] Ebaõnnestunud video vabastab korra ja allalaadimine ei kuluta uut.
- [ ] Foto taastamine töötab endiselt tasuta.
- [ ] Mobiilis saab maksta, tagasi tulla ja video salvestada.
- [ ] Google’i pärisvideot on kontrollitud; tegelik kulu on teada.
- [ ] Live-võtmed, live-hind ja live-webhook kuuluvad samasse keskkonda.
- [ ] Müügi peatamine on katsetatud; olemasolevate ostude kontroll ja valmis videote allalaadimine jäävad toimima.
- [ ] Taastamise ja tagasimakse töökorraldus on läbi proovitud.

Järgmine praktiline samm on arendajal rakendada [ingliskeelne teostusjuhend](AGENT-IMPLEMENTATION.md) testkeskkonnas. Selle dokumendi loomine ei käivita päris oste ega tasulisi videopäringuid.
