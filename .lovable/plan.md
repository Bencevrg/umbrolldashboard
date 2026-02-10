

# Admin felhasználo kezelesi fejlesztesek

## Jelenlegi helyzet

Az admin feluleten a felhasznalok tablazatban csak a `user_id` toredeke latszik (elso 8 karakter). Az email cimek az `auth.users` tablaban vannak, ami nem erheto el kozvetlenul a kliensbol. Felhasznalo torles funkio jelenleg nem letezik.

## Valtozasok

### 1. Uj edge function: `admin-users`

Egy uj backend fuggveny letrehozasa (`supabase/functions/admin-users/index.ts`), amely ket muveletet tamogat:

- **`list`**: Lekeri az osszes `user_roles` rekordot, majd az `auth.admin.listUsers()` segitsegevel osszepaositja a felhasznalok email cimeit a user ID-khez. Visszaad egy tombot: `{ id, user_id, role, email }`.

- **`delete`**: Torol egy felhasznalot: eloszor torli a `user_roles` es `user_mfa_settings` bejegyzeseket, majd az `auth.admin.deleteUser()` hivassal magat a felhasznalot is. Az admin nem torelheti onmagat.

Mindket muvelet ellenorzi, hogy a hivo admin jogosultsaggal rendelkezik-e (a meglevo `invite-user` mintajat kovetjuk).

### 2. Frontend modositasok: `AdminUsers.tsx`

- A `UserRole` interface kiegeszitese egy `email` mezovel.
- A `fetchData` fuggveny az uj `admin-users` edge function `list` muveletet hivja a kozvetlen Supabase lekeres helyett.
- A felhasznalok tablazatban uj "Email" oszlop jelenik meg.
- Uj "Torles" gomb minden felhasznalohoz (kiveve az aktualis admin felhasznalot).
- Torles elott megerosito dialogus (`AlertDialog`) jelenik meg, hogy elkeruljuk a veletlen torlest.
- A `deleteUser` fuggveny az `admin-users` edge function `delete` muveletet hivja.

### 3. Felhasznalo torles biztonsagi szempontok

- Csak admin vegezheti (edge function ellenorzi).
- Az admin nem torelheti sajat fiokjat.
- Megerosito dialog a kliensen.
- A torles kaszkadban torli: user_roles, user_mfa_settings, auth.users rekordot.

---

## Technikai reszletek

### Edge function struktura (`admin-users/index.ts`)

```
POST { action: "list" }
  -> Admin ellenorzes (JWT + user_roles tabla)
  -> auth.admin.listUsers() + user_roles lekeres
  -> Visszaad: [{ id, user_id, role, email, created_at }]

POST { action: "delete", userId: "uuid" }
  -> Admin ellenorzes
  -> Nem engedi sajat magat torolni
  -> Torli: user_mfa_settings, user_roles (serviceClient)
  -> Torli: auth.admin.deleteUser(userId)
  -> Visszaad: { success: true }
```

### AdminUsers.tsx modositasok

- Uj interface: `email?: string` mezo hozzaadasa
- `fetchData`: `supabase.functions.invoke('admin-users', { body: { action: 'list' } })`
- Tablazat: Email oszlop hozzaadasa a User ID utan
- Torles gomb: `AlertDialog` megerositovel
- `deleteUser(userId)`: `supabase.functions.invoke('admin-users', { body: { action: 'delete', userId } })`

