
# Dummy adatok eltavolitasa - csak valos adatok megjelenitese

## Cel

A dashboard jelenleg mock/dummy adatokkal indul, ami felrevezeto lehet. Ehelyett toltes allapotot (loading/skeleton) kell mutatni amig a valos adatok meg nem erkeznek, es hiba eseten hibauzenet jelenik meg.

## Valtozasok

### 1. `src/data/mockPartners.ts` - Torles

A teljes fajl torlese, mivel tobbet nem hasznaljuk.

### 2. `src/hooks/usePartnerData.ts` - Ures tombok alapertelmezettnek

- Az `import { mockPartners }` sor eltavolitasa.
- A `cachedData` es a kijelentkezeskori reset ures tombokkel inicializalodik (`partners: []`) a `mockPartners` helyett.
- Uj `hasFetched` boolean allapot bevezetese, ami jelzi, hogy legalabb egyszer lefutott-e mar az adatlekeres (sikeresen vagy sikertelenul). Ez segit megkulonboztetni a "meg nem kertuk le" es a "lekertuk de ures" allapotokat.

### 3. `src/pages/Index.tsx` - Loading es ures allapot kezelese

- A `usePartnerData` hook-bol egy uj `hasFetched` erteket is kiolvasunk.
- Minden adatmegjelenitesi tab-nel (partners, best, worst, sleeping, categories):
  - Ha `isLoading` es meg nem volt fetch (`!hasFetched`): **Skeleton/loading allapot** megjelenites (pl. animalt placeholder kartyak es tablazat).
  - Ha `hasFetched` es a tomb ures: **"Nincsenek adatok"** uzenet a Frissites gombbal.
  - Ha vannak adatok: a jelenlegi megjelenites valtozatlanul.

### 4. Loading megjelenites

A meglevo `Skeleton` komponenst (`src/components/ui/skeleton.tsx`) hasznaljuk a loading allapothoz. A stats kartyak, grafikonok es tablazat helyett skeleton elemek jelennek meg a betoltes soran.

---

## Technikai reszletek

### usePartnerData.ts modositasok

```text
Uj allapot:
  hasFetched: boolean (false alapertelmezett)

cachedData alapertek:
  { partners: [], topBest: [], topWorst: [], sleeping: [], partnerProductStats: [] }

fetchPartners vegen (finally):
  hasFetched = true (mind sikeres, mind sikertelen eseten)

Kijelentkezeskor:
  cachedData = { partners: [], ... }
  hasFetched = false

Return:
  + hasFetched
```

### Index.tsx loading minta

A `renderContent()` partners case elejen:

```text
if (isLoading && !hasFetched) {
  -> Skeleton kartyak (5 db) + skeleton tablazat sorok
}

if (hasFetched && partners.length === 0) {
  -> "Nincsenek adatok" uzenet + Frissites gomb
}

// egyebkent a jelenlegi megjelenites
```

Ugyanez a minta alkalmazando a best, worst, sleeping es categories tabokra is.
