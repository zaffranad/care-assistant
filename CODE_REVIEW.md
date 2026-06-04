# Revue de code — Care Assistant

> Date : 4 juin 2026
> Périmètre : Next.js 16 / React 19 / Prisma 7 + LibSQL / NextAuth v5 — code `src/` + `prisma/` + `scripts/` (~80 fichiers).

## Note globale : 7,5 / 10

Projet de bonne qualité, cohérent et homogène. Les conventions sont respectées partout (auth systématique, scoping `userId`, messages d'erreur FR, toasts, structure des routes). Les principaux axes d'amélioration concernent la **résilience des données** (import non transactionnel), un **bug de fuseau horaire** sur le filtrage par jour, la **validation d'entrées**, et un peu de **duplication** à factoriser.

---

## ✅ Points forts

- **Sécurité d'accès cohérente** : chaque route data appelle `getAuthenticatedUserId()` puis scope les requêtes par `userId`, avec en plus une vérification de propriété avant `DELETE`/`PATCH` (`symptom.userId !== userId`). Bonne défense en profondeur (middleware + route).
- **Architecture claire et homogène** : séparation `lib` / `api` / `components` nette, types `*FormData` / `*Response` bien nommés, singleton Prisma hot-reload-safe.
- **UX soignée** : gestion des états `loading`/`submitting`, feedback systématique via Sonner, confirmations sur actions destructrices, navigation tactile, dark mode.
- **Schéma Prisma propre** : `onDelete: Cascade` partout, index pertinents (`userId`, `occurredAt`, `date`), contrainte `@@unique([medicationId, date])`.
- **`useCallback` / `useMemo`** correctement utilisés pour éviter les boucles de re-render et mémoïser les dérivations coûteuses (calcul des « oublis » médicaments).

---

## 🔴 Critique — Résilience & intégrité des données

### 1. L'import n'est pas transactionnel → risque de perte totale de données

Dans `src/app/api/import/route.ts`, la séquence est : **supprimer tout**, puis réinsérer en plusieurs appels séparés.

```ts
// Phase 1: Delete all existing user data
const existingMeds = await prisma.medication.findMany({ where: { userId }, select: { id: true } });
const existingMedIds = existingMeds.map((m) => m.id);

await Promise.all([
  prisma.medicationLog.deleteMany({ where: { medicationId: { in: existingMedIds } } }),
  prisma.symptom.deleteMany({ where: { userId } }),
  // ...
]);
await prisma.medication.deleteMany({ where: { userId } });
```

Si **n'importe quelle insertion échoue** (fichier corrompu, date invalide, coupure réseau Turso), l'utilisateur se retrouve avec **toutes ses données supprimées et aucune réimportée**. Pour une app de suivi médical, c'est le risque le plus grave.

**Reco** : envelopper suppression + insertion dans un seul `prisma.$transaction(async (tx) => { ... })`. En cas d'échec, rollback automatique → l'utilisateur garde ses données.

### 2. Validation d'import superficielle

`validateExportData` ne vérifie que la présence des tableaux, pas la forme des éléments :

```ts
function validateExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (!Array.isArray(d.predefinedSymptoms)) return false;
  if (!Array.isArray(d.symptoms)) return false;
  if (!Array.isArray(d.medications)) return false;
  return true;
}
```

Un élément avec `intensity: 999`, `bristolType: 42` ou `occurredAt: "pas une date"` sera inséré tel quel (et `new Date("invalide")` produit une date invalide stockée en base).

**Reco** : valider chaque enregistrement (bornes, format date), idéalement avec **Zod**, et rejeter ou ignorer proprement les lignes invalides.

---

## 🟠 Majeur — Fiabilité

### 3. Bug de fuseau horaire sur le filtrage « par jour »

Incohérence entre **écriture** (heure locale) et **filtrage** (UTC).

- À l'écriture (`symptom-form.tsx`) : `new Date(`${date}T${time}:00`).toISOString()` → heure **locale** convertie en instant.
- Au filtrage (`api/symptoms/route.ts`) : bornes **UTC** `new Date(`${date}T00:00:00.000Z`)` / `...T23:59:59.999Z`.
- « Aujourd'hui » (`getTodayDateString`) : calculé en **local** (`format(new Date(), "yyyy-MM-dd")`).

**Conséquence** : pour un utilisateur en UTC+2, un symptôme saisi à 01h00 (= 23h00 UTC la veille) est rangé dans le mauvais jour, et peut **disparaître de la liste du jour** ou être mal positionné dans le reporting. Idem pour `bowel-movements`. (Les `significant-events` et `medication-logs` n'ont pas ce souci car ils stockent une `date` string.)

**Reco** : choisir une stratégie unique. Le plus simple : calculer les bornes de jour en heure locale serveur, ou mieux, stocker aussi une colonne `date` (YYYY-MM-DD locale) comme pour les médicaments et filtrer dessus. À uniformiser entre tous les modèles « occurredAt ».

### 4. Modales custom sans gestion clavier / focus

`confirm-dialog.tsx` et la modale d'import dans `settings/page.tsx` :

- enveloppent les enfants dans un `<div onClick>` (pas de rôle, pas activable au clavier) ;
- pas de fermeture par `Échap`, pas de focus-trap, pas de `role="dialog"` / `aria-modal`.

shadcn/ui fournit déjà un composant `Dialog` / `AlertDialog` (Radix) accessible.

**Reco** : remplacer ces modales maison par le primitive Radix pour gagner accessibilité et cohérence.

---

## 🟡 Mineur — Validation des entrées API

Plusieurs routes font confiance aux valeurs reçues :

- `symptoms` POST : `Number(intensity)` sans contrôle `NaN` ; `new Date(occurredAt)` sans vérifier la validité. Le garde `if (!name || !intensity ...)` reste fragile (logique « falsy »).
- `medications` POST : `Number(dosage)` non vérifié (`NaN` possible), `time` non validé au format `HH:mm`.
- `medications/[id]` PATCH valide `time` uniquement par `length > 0` (`"99:99"` passe).

À l'inverse, `significant-events` fait du **bon travail** (regex sur `date` et `time`) — c'est le modèle à généraliser :

```ts
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { /* 400 */ }
if (!/^\d{2}:\d{2}$/.test(time)) { /* 400 */ }
```

**Reco** : centraliser la validation (Zod) et l'appliquer à toutes les routes d'écriture.

---

## 🟡 Mineur — Maintenabilité & duplication

1. **`formatDelta` dupliqué** à l'identique dans `timeline.tsx` et `medication-tracker.tsx`. → déplacer dans `lib/date-utils.ts`.
2. **Échelle de Bristol définie 3-4 fois** : `BRISTOL_LABELS` dans `timeline.tsx` et `bowel-movement-chart.tsx`, `BRISTOL_SCALE` dans `bowel-movement-tracker.tsx`, et la logique de catégorie dans `export-button.tsx`. → une seule source dans `lib/`.
3. **Calcul des « oublis » de médicaments dupliqué** dans `reporting/page.tsx` : `missedEntries` et `timelineMissedEntries` sont ~35 lignes quasi identiques. → extraire `computeMissedEntries(medications, logs, from, to)`.
4. **Construction du `where` par date dupliquée** dans 4 routes GET, avec deux variantes (bornes UTC vs `date` string). → helper partagé `buildDateRangeWhere(...)`, ce qui réglerait aussi le point #3 (tz).
5. **Typage `where: Record<string, unknown>`** : on perd le typage Prisma. → utiliser `Prisma.SymptomWhereInput`, etc.

---

## 🟡 Mineur — Qualité de code & lint

- **Variables `error` inutilisées** dans plusieurs `catch (error) { ... }` qui ne s'en servent pas (`page.tsx`, `symptom-form.tsx`, `export-button.tsx`). → `catch { }` (comme déjà fait ailleurs) pour éviter le warning `no-unused-vars`.
- **`<img>` natif** dans `nav-bar.tsx` au lieu de `next/image` → déclenche `@next/next/no-img-element`. Pour un avatar Google distant, `next/image` nécessite la config `images.remotePatterns`, sinon garder `<img>` mais désactiver explicitement la règle sur la ligne.
- **`next.config.ts` vide** : aucun en-tête de sécurité (CSP, `X-Frame-Options`, `Referrer-Policy`…), pas de config `images`. Pour une app de santé, ajouter au moins des `headers()` basiques.
- **Double lockfile** : `package-lock.json` **et** `pnpm-lock.yaml` + `pnpm-workspace.yaml` cohabitent. Ambigu pour la CI/Vercel et source de divergences de versions. → choisir un seul gestionnaire et supprimer l'autre lockfile.

---

## 🟡 Mineur — Sécurité

- **Détection `secureCookie` fragile** dans `middleware.ts` : `request.url.startsWith("https://")`. Derrière le proxy Vercel, l'URL interne peut être en `http`, ce qui casserait la lecture du cookie `__Secure-`. → s'appuyer sur `process.env.NODE_ENV === "production"` ou `x-forwarded-proto`.
- **Pas de rate limiting** sur les routes (import/cleanup notamment, qui sont destructrices). Acceptable pour une app perso, à garder en tête si ouverture.
- **CSRF** : les mutations reposent sur le cookie de session (SameSite=lax par défaut), ce qui protège des POST cross-site, mais aucune protection explicite. OK en l'état.

---

## 🟢 Tests & observabilité

- **Aucun test** dans le repo. Vu la criticité (données médicales, import destructeur, calcul d'oublis, conversions de dates), des tests unitaires cibleraient utilement : `computeMissedEntries`, `formatDelta`, validation d'import, bornes de dates. Un ou deux tests d'intégration sur `/api/import` (rollback) seraient très rentables.
- Logs serveur en `console.error` uniquement — suffisant à ce stade.

---

## Roadmap priorisée

| Priorité | Action | Fichier(s) |
|---|---|---|
| 1 🔴 | Rendre l'import transactionnel (`$transaction`) | `api/import/route.ts` |
| 2 🔴 | Valider la forme des données importées (Zod) | `api/import/route.ts`, `lib/` |
| 3 🟠 | Corriger / uniformiser le filtrage par jour (fuseau) | `api/symptoms`, `api/bowel-movements`, `lib/date-utils` |
| 4 🟠 | Remplacer modales maison par Radix `AlertDialog` | `confirm-dialog.tsx`, `settings/page.tsx` |
| 5 🟡 | Centraliser validation des écritures (Zod) | toutes routes POST/PATCH |
| 6 🟡 | Factoriser `formatDelta`, Bristol, `computeMissedEntries`, `where` date | `lib/`, `reporting/page.tsx` |
| 7 🟡 | Nettoyer lint (`catch`, `<img>`), en-têtes sécurité, lockfile unique | divers, `next.config.ts` |
| 8 🟢 | Ajouter une base de tests unitaires | nouveau `__tests__/` |
