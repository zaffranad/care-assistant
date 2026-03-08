# Care Assistant

Application web de suivi quotidien de symptômes avec visualisation et reporting.

## Fonctionnalités

- **Saisie de symptômes** : nom, intensité (1-10), notes libres, date/heure
- **Horodatage** : automatique à l'heure de saisie, ou date dans le passé au choix
- **Vue du jour** : date complète en français + liste des symptômes du jour
- **Timeline** : vue chronologique de tous les symptômes
- **Graphique d'évolution** : courbe d'intensité par symptôme dans le temps
- **Filtres** : par période (7j, 30j, 90j, tout) et par nom de symptôme
- **Export** : CSV et JSON
- **Mode sombre** : supporté

## Stack technique

- **Framework** : Next.js 16 (App Router, TypeScript)
- **UI** : Tailwind CSS v4 + shadcn/ui
- **Base de données** : SQLite via Prisma ORM v7
- **Visualisation** : Recharts
- **Dates** : date-fns

## Démarrage rapide (développement)

### Prérequis

- Node.js v20.19+ ou v22.12+
- npm

### Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd care-assistant

# Installer les dépendances
npm install

# Créer la base de données et appliquer les migrations
npx prisma migrate dev

# Lancer le serveur de développement
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm run db:migrate` | Appliquer les migrations Prisma |
| `npm run db:push` | Pousser le schéma sans migration |
| `npm run db:studio` | Interface visuelle Prisma Studio |

## Déploiement en production

### Vercel + Turso (recommandé, gratuit)

#### 1. Créer une base de données Turso

**Installer le CLI Turso** :

```bash
# Windows (PowerShell)
iwr https://get.tur.so/install.ps1 -useb | iex

# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Ou via Homebrew
brew install tursodatabase/tap/turso
```

**Créer la base et obtenir les credentials** :

```bash
# Se connecter à Turso
turso auth login

# Créer une base de données
turso db create care-assistant

# Obtenir l'URL de connexion
turso db show care-assistant --url
# Exemple de sortie : libsql://care-assistant-xxx.turso.io

# Créer un token d'authentification
turso db tokens create care-assistant
# Copier le token généré
```

#### 2. Pousser le schéma Prisma vers Turso

```bash
# Configurer les variables d'environnement localement (temporaire)
$env:DATABASE_URL="libsql://care-assistant-xxx.turso.io"  # Windows PowerShell
$env:DATABASE_AUTH_TOKEN="votre-token"                     # Windows PowerShell

# Ou sur macOS/Linux :
# export DATABASE_URL="libsql://care-assistant-xxx.turso.io"
# export DATABASE_AUTH_TOKEN="votre-token"

# Pousser le schéma (créer les tables)
npx prisma db push
```

#### 3. Déployer sur Vercel

1. **Connecter le repo GitHub à Vercel** (si pas déjà fait)
   - Aller sur [vercel.com](https://vercel.com)
   - Importer le repo GitHub `care-assistant`

2. **Configurer les variables d'environnement dans Vercel** :
   - Aller dans **Settings** → **Environment Variables**
   - Ajouter :
     - `DATABASE_URL` : `libsql://care-assistant-xxx.turso.io`
     - `DATABASE_AUTH_TOKEN` : votre token Turso
     - `VAPID_PUBLIC_KEY` : votre clé publique VAPID
     - `VAPID_PRIVATE_KEY` : votre clé privée VAPID
     - `CRON_SECRET` : votre secret cron
   - Ces variables doivent être configurées pour **Production**, **Preview**, et **Development**

3. **Redéployer** :
   - Faire un `git push` (déploiement automatique)

## Structure du projet

```
src/
├── app/
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Page de saisie (accueil)
│   ├── globals.css          # Thème et styles
│   ├── reporting/
│   │   └── page.tsx         # Page reporting
│   └── api/
│       └── symptoms/
│           ├── route.ts     # GET, POST
│           └── [id]/
│               └── route.ts # DELETE
├── components/
│   ├── ui/                  # Composants shadcn/ui
│   ├── nav-bar.tsx          # Navigation
│   ├── symptom-form.tsx     # Formulaire de saisie
│   ├── symptom-list.tsx     # Liste des symptômes du jour
│   ├── timeline.tsx         # Vue timeline
│   ├── intensity-chart.tsx  # Graphique d'évolution
│   └── export-button.tsx    # Boutons d'export
└── lib/
    ├── prisma.ts            # Client Prisma singleton
    ├── date-utils.ts        # Utilitaires de dates
    ├── types.ts             # Types TypeScript
    └── utils.ts             # Utilitaires shadcn
```

## Évolutions possibles

- Authentification (NextAuth) pour multi-utilisateurs
- Catégories de symptômes personnalisables
- Corrélations entre symptômes
- Export PDF pour partage avec un médecin
