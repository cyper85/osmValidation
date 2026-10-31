# osmValidation – Analyse

Stand: 2026-10-31

## Ziel

JavaScript-Bibliothek, die typische OpenStreetMap-Werte prüft (Telefon, Mail,
URL, Social Media, Wikipedia, Wikidata). Sie bleibt eine **eigenständige
Bibliothek** und wird u. a. von
[osmCorrection](https://github.com/cyper85/osmCorrection) genutzt.

## Ist-Zustand

Version 0.0.3 von 2017. Alles steckt in einer einzigen Datei
`osmValidation.js`. Sie legt ein globales Singleton an und bietet zusätzlich
ein jQuery-Plugin und einen CommonJS-Export. Die Typen in `osmValidation.d.ts`
beschreiben nur ein `interface`, ohne Modul-Export. Es gibt außerdem eine
`bower.json`.

Funktionen: `phone`, `mail`, `url`, `facebook`, `twitter`, `google`,
`wikipedia`, `wikidata`. Jede gibt nur `true`/`false` zurück und schreibt den
Grund in die gemeinsame Eigenschaft `msg`.

Tests (mocha, `test/*.js`): 42 bestanden, 1 fehlgeschlagen
(`urls`: `ReferenceError: digitToBasic is not defined`).

## Fehler

- **IDN-URLs stürzen ab**: Der Punycode-Code ist unvollständig aus
  `punycode.js` kopiert. `digitToBasic`, `adapt` und `error` fehlen, deshalb
  wirft `url("https://server-börse.de")` einen `ReferenceError`. Mit Pfad
  (`http://müller.de/x`) entfernt die Regex `idn_name_regex` den ganzen Host,
  und das Ergebnis ist fälschlich `false`. Außerdem wird `idn2ascii` zweimal
  hintereinander aufgerufen.
- **URL-Prüfung zu locker**: `http://a.b?x` gilt als gültig. Benutzer und
  Passwort (`user:pass@`) werden nur erkannt, wenn der Name ein Zeichen lang
  ist. Die IPv6-Regex ist ungenau.
- **Google+**: Der Dienst ist seit 2019 abgeschaltet. Außerdem ist die Regex
  `/^\d{+}21}$/` kaputt, sodass numerische IDs nie erkannt werden.
- **Twitter**: `x.com` fehlt, `twitter.de` gibt es nicht. Nach dem `return`
  steht toter Code (eine kopierte Mail-Regex).
- **Facebook**: Die URL-Regex akzeptiert `f.com` und `https:/` mit nur einem
  Schrägstrich. `profile.php?id=…` wird nicht erkannt.
- **Telefon**: Eine feste Liste von Notrufnummern gilt für alle Länder. Die
  Regex prüft nur „+ und 7–15 Ziffern“, ohne gültige Ländervorwahl. Werte mit
  mehreren Nummern (`;`) werden als eine einzige Nummer geprüft.
  `PHONE_INVALID` enthält eine nicht maskierte Regex als Text.
- **Wikipedia**: Sprachcodes mit Bindestrich (`zh-yue:`, `be-tarask:`) werden
  nicht erkannt. Eine vollständige URL gilt als gültig, obwohl die
  OSM-Konvention `sprache:Titel` verlangt. Auch ein Wert ohne Sprache gilt als
  gültig.
- **Mail**: Keine internationalisierten Domains, und ein `mailto:`-Präfix wird
  nicht als typischer, behebbarer Fehler erkannt.
- **API**: `msg` als gemeinsamer Zustand ist fehleranfällig, z. B. bei einem
  Aufruf ohne Objekt (`const f = v.phone; f(x)`) oder bei mehreren Prüfungen
  nacheinander. Es gibt keine Korrekturvorschläge.

## Empfehlung: Modernisierung

- **Werkzeuge**: TypeScript 5 als ES-Modul mit mitgelieferten Typen,
  veröffentlicht als npm-Paket. jQuery-Plugin, Bower und das globale Singleton
  entfallen.
- **Rückgabewert** statt `msg`, z. B.:

  ```ts
  interface ValidationResult {
    valid: boolean;
    code: string;        // maschinenlesbar, z. B. "URL_LOCAL_ADDRESS"
    message: string;
    suggestion?: string; // korrigierter Wert, falls automatisch möglich
  }
  function phone(value: string, opts?: { country?: string }): ValidationResult;
  ```

  Mit `suggestion` kann osmCorrection Korrekturen nach dem Muster „alt → neu“
  anbieten.
- **Mehrfachwerte**: eine Hilfsfunktion, die Werte an `;` aufteilt und jeden
  Teil einzeln prüft.
- **Telefon**: `libphonenumber-js` statt eigener Regex. Diese Bibliothek prüft
  die Ländervorwahl und erzeugt das internationale Format als Vorschlag. Das
  Land kommt als Option herein (aus `addr:country` oder dem Kartenausschnitt).
  Notrufnummern nach Land statt in einer gemeinsamen Liste.
- **URL**: `new URL()` übernimmt Parsing und IDN-Umwandlung. Der eigene
  Punycode-Code fällt weg. Danach prüfen: Protokoll `http`/`https`, keine
  lokalen Adressen, ein Host mit gültiger TLD.
- **Social Media**: Google+ entfernen, `x.com` ergänzen. Die Formate am OSM-Wiki
  ausrichten (welche Keys einen Benutzernamen und welche eine URL erwarten) und
  zwischen beiden Formen umwandeln.
- **Wikipedia**: Format `sprache:Titel` verlangen. Eine URL als behebbaren
  Fehler melden, mit Vorschlag `de:Titel` (URL-Dekodierung, `_` → Leerzeichen).
- **Tests**: Die vorhandenen mocha-Tests übernehmen (z. B. nach vitest) und um
  die oben genannten Fehlerfälle ergänzen.
- **Grenze**: Die Bibliothek prüft nur das Format und arbeitet offline. Ob ein
  Ziel existiert (Wikidata-API usw.), gehört in den Aufrufer, z. B. osmCorrection.

## Einbindung in osmCorrection

Als npm-Abhängigkeit statt Git-Submodul. Während der Entwicklung lokal über
`npm link` oder einen npm-Workspace.
