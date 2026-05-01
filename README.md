# Care Assistant

Application web de suivi quotidien de santé : symptômes, médicaments, transit intestinal, avec visualisation et reporting.

## Fonctionnalités

### Saisie quotidienne (page d'accueil)

- **Suivi de médicaments** : prise quotidienne avec heure prévue vs heure réelle, calcul du décalage
- **Transit intestinal** : saisie sur l'échelle de Bristol (1-7) avec notes et horodatage
- **Saisie de symptômes** : nom (prédéfini ou libre), intensité (1-10), notes, date/heure
- **Horodatage** : automatique à l'heure de saisie, ou date dans le passé au choix
- **Vue du jour** : date complète en français + liste des symptômes du jour

### Reporting & Visualisation

- **Graphique d'intensité** : courbe d'évolution par symptôme dans le temps (Recharts)
- **Graphique transit** : évolution de l'échelle de Bristol dans le temps
- **Timeline** : vue chronologique par semaine de tous les événements (symptômes, prises de médicaments, transit)
- **Prises manquées** : détection automatique des médicaments non pris
- **Filtres rapides** : période par boutons (7j, 30j, 90j, tout) et événement par menu compact
- **Export** : CSV et JSON filtrés par la période sélectionnée

### Paramètres

- **Symptômes prédéfinis** : gestion de la liste de symptômes pour saisie rapide
- **Médicaments** : CRUD complet (nom, posologie en mg, heure de prise, actif/inactif)
- **Export/Import** : sauvegarde complète JSON (format versionné v1) et restauration
- **Nettoyage** : suppression de l'historique (conserve les configurations)

### Autres

- **Authentification** : Google OAuth via NextAuth v5 (JWT)
- **Mode sombre** : thème système/clair/sombre
- **Navigation tactile** : swipe entre les pages sur mobile
- **Interface française** : toute l'UI est en français

## Stack technique

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Runtime | React | 19.2.3 |
| Langage | TypeScript | 5.x |
| Base de données | SQLite via Prisma ORM | Prisma 7.4 |
| Adaptateur DB | LibSQL (`@prisma/adapter-libsql`) | 7.4 |
| Production DB | Turso (LibSQL cloud) | - |
| Authentification | NextAuth v5 (beta) + Google | 5.0.0-beta.30 |
| UI Framework | Tailwind CSS v4 | 4.x |
| Composants | shadcn/ui (New York) + Radix UI | - |
| Icônes | Lucide React | 0.564 |
| Graphiques | Recharts | 3.7 |
| Dates | date-fns (locale `fr`) | 4.1 |
| Notifications | Sonner | 2.0 |
| Thème | next-themes | 0.4 |

## Architecture

```
care-assistant/
├── .cursor/rules/          # Règles Cursor pour l'IA (vibe coding)
├── prisma/
│   ├── schema.prisma       # Schéma de données (9 modèles)
│   ├── migrations/         # Historique des migrations
│   ├── dev.db              # Base SQLite locale (dev)
│   └── *.sql               # Scripts SQL utilitaires
├── scripts/
│   ├── init-local-db.mjs   # Initialisation DB locale
│   └── migrate-prod-*.mjs  # Scripts de migration Turso (prod)
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Layout racine (fonts, providers, nav)
│   │   ├── page.tsx        # Page de saisie quotidienne
│   │   ├── globals.css     # Thème Tailwind v4 + tokens shadcn
│   │   ├── reporting/
│   │   │   └── page.tsx    # Page reporting & visualisation
│   │   ├── settings/
│   │   │   └── page.tsx    # Page paramètres
│   │   ├── auth/signin/
│   │   │   └── page.tsx    # Page de connexion Google
│   │   └── api/
│   │       ├── auth/[...nextauth]/  # Handlers NextAuth
│   │       ├── symptoms/            # CRUD symptômes
│   │       ├── predefined-symptoms/ # Gestion liste prédéfinie
│   │       ├── medications/         # CRUD médicaments
│   │       ├── medication-logs/     # Logs de prise quotidienne
│   │       ├── bowel-movements/     # CRUD transit intestinal
│   │       ├── export/              # Export JSON complet
│   │       ├── import/              # Import JSON (remplacement)
│   │       └── cleanup/             # Nettoyage historique
│   ├── components/
│   │   ├── ui/                 # Primitives shadcn/ui (14 composants)
│   │   ├── symptom-form.tsx    # Formulaire de saisie de symptôme
│   │   ├── symptom-list.tsx    # Liste des symptômes du jour
│   │   ├── medication-tracker.tsx    # Suivi de prise quotidienne
│   │   ├── bowel-movement-tracker.tsx # Saisie transit (Bristol)
│   │   ├── timeline.tsx        # Vue chronologique par semaine
│   │   ├── timeline-week-picker.tsx  # Navigation semaine
│   │   ├── intensity-chart.tsx # Graphique d'intensité (Recharts)
│   │   ├── bowel-movement-chart.tsx  # Graphique Bristol (Recharts)
│   │   ├── export-button.tsx   # Boutons d'export CSV/JSON
│   │   ├── confirm-dialog.tsx  # Dialogue de confirmation
│   │   ├── nav-bar.tsx         # Barre de navigation
│   │   ├── swipe-navigator.tsx # Navigation tactile
│   │   └── theme-provider.tsx  # Wrapper next-themes
│   ├── lib/
│   │   ├── auth.ts         # Config NextAuth + getAuthenticatedUserId()
│   │   ├── prisma.ts       # Client Prisma singleton (LibSQL adapter)
│   │   ├── types.ts        # Types TypeScript partagés
│   │   ├── date-utils.ts   # Formatage dates FR + couleurs intensité
│   │   └── utils.ts        # cn() (clsx + tailwind-merge)
│   ├── generated/prisma/   # Client Prisma généré (ne pas éditer)
│   └── middleware.ts        # Protection JWT des routes
├── components.json          # Config shadcn/ui
├── next.config.ts           # Config Next.js
├── prisma.config.ts         # Config Prisma 7
├── tsconfig.json            # TypeScript (alias @/* → ./src/*)
├── postcss.config.mjs       # PostCSS + Tailwind v4
└── eslint.config.mjs        # ESLint (core-web-vitals + typescript)
```

## Modèle de données

```
User ──┬── Account (OAuth Google)
       ├── Session (DB sessions, JWT utilisé à la place)
       ├── Symptom (name, intensity 1-10, occurredAt, notes)
       ├── PredefinedSymptom (name, unique par user)
       ├── Medication (name, dosage mg, time HH:mm, active)
       │   └── MedicationLog (date, takenAt, scheduledAt, deltaMinutes)
       └── BowelMovement (bristolType 1-7, occurredAt, notes)
```

## API REST

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | Authentification NextAuth (Google OAuth) |
| `/api/symptoms` | GET, POST | Lister (par date ou période) / créer un symptôme |
| `/api/symptoms/[id]` | DELETE | Supprimer un symptôme |
| `/api/predefined-symptoms` | GET, POST, DELETE | Lister / ajouter / vider les symptômes prédéfinis |
| `/api/predefined-symptoms/[id]` | DELETE | Supprimer un symptôme prédéfini |
| `/api/medications` | GET, POST | Lister (actifs ou tous) / créer un médicament |
| `/api/medications/[id]` | PATCH, DELETE | Modifier (posologie, heure, actif) / supprimer |
| `/api/medication-logs` | GET, POST | Lister / enregistrer une prise (upsert par med+date) |
| `/api/bowel-movements` | GET, POST | Lister / créer une entrée transit |
| `/api/bowel-movements/[id]` | DELETE | Supprimer une entrée transit |
| `/api/export` | GET | Export JSON complet (format versionné v1) |
| `/api/import` | POST | Import JSON (remplace toutes les données) |
| `/api/cleanup` | DELETE | Supprimer l'historique (garde config) |

## Démarrage rapide (développement)

### Prérequis

- Node.js v20.19+ ou v22.12+
- npm

### Installation

```bash
git clone <url-du-repo>
cd care-assistant

npm install

npx prisma migrate dev

npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Variables d'environnement

Créer un fichier `.env` à la racine :

```env
# Base de données (dev: fichier local, prod: URL Turso)
DATABASE_URL="file:./prisma/dev.db"
DATABASE_AUTH_TOKEN=""

# Authentification NextAuth
AUTH_SECRET="votre-secret-genere"
AUTH_GOOGLE_ID="votre-google-client-id"
AUTH_GOOGLE_SECRET="votre-google-client-secret"
```

Générer un `AUTH_SECRET` : `npx auth secret`

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (`prisma generate` + `next build`) |
| `npm start` | Serveur de production |
| `npm run lint` | Linter ESLint |
| `npm run db:init-local` | Initialiser la DB locale via SQL |
| `npm run db:migrate` | Appliquer les migrations Prisma |
| `npm run db:push` | Pousser le schéma sans migration |
| `npm run db:studio` | Interface visuelle Prisma Studio |
| `npm run migrate:prod-bowel` | Migration prod : table BowelMovement |

## Déploiement en production

### Vercel + Turso (recommandé, gratuit)

#### 1. Créer une base de données Turso

```bash
# Installer le CLI Turso
# Windows (PowerShell)
iwr https://get.tur.so/install.ps1 -useb | iex
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Se connecter et créer la base
turso auth login
turso db create care-assistant
turso db show care-assistant --url       # → libsql://care-assistant-xxx.turso.io
turso db tokens create care-assistant    # → copier le token
```

#### 2. Pousser le schéma vers Turso

```bash
# Windows PowerShell
$env:DATABASE_URL="libsql://care-assistant-xxx.turso.io"
$env:DATABASE_AUTH_TOKEN="votre-token"

# macOS/Linux
export DATABASE_URL="libsql://care-assistant-xxx.turso.io"
export DATABASE_AUTH_TOKEN="votre-token"

npx prisma db push
```

#### 3. Déployer sur Vercel

1. Connecter le repo GitHub à [vercel.com](https://vercel.com)
2. Configurer les variables d'environnement dans **Settings → Environment Variables** :
   - `DATABASE_URL` : URL Turso
   - `DATABASE_AUTH_TOKEN` : token Turso
   - `AUTH_SECRET` : secret NextAuth
   - `AUTH_GOOGLE_ID` : Google OAuth client ID
   - `AUTH_GOOGLE_SECRET` : Google OAuth client secret
3. Déployer via `git push` (déploiement automatique)

## Migrations de production

Les migrations Turso/SQLite en production nécessitent des scripts manuels (limitations ALTER TABLE de SQLite). Les scripts sont dans `scripts/` :

| Script | Description |
|--------|-------------|
| `migrate-prod-step1.mjs` | Ajout tables Auth + userId nullable |
| `migrate-prod-step2.mjs` | Attribution des données au premier User |
| `migrate-prod-step3.mjs` | Finalisation NOT NULL + indexes/FK |
| `migrate-prod-step4.mjs` | Ajout table BowelMovement |
