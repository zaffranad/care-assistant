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

### Option 1 : Vercel + Turso (recommandé, gratuit)

1. **Créer une base Turso** :
   ```bash
   # Installer le CLI Turso
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Se connecter
   turso auth login
   
   # Créer une base de données
   turso db create care-assistant
   
   # Obtenir l'URL
   turso db show care-assistant --url
   
   # Créer un token
   turso db tokens create care-assistant
   ```

2. **Adapter le code pour Turso** :
   
   Remplacer `@prisma/adapter-better-sqlite3` par `@prisma/adapter-libsql` dans `src/lib/prisma.ts` et mettre à jour l'initialisation avec l'URL et le token Turso.

3. **Déployer sur Vercel** :
   - Connecter le repo GitHub à Vercel
   - Configurer les variables d'environnement :
     - `DATABASE_URL` : URL Turso (`libsql://...`)
     - `DATABASE_AUTH_TOKEN` : Token Turso

### Option 2 : Tout autre hébergeur Node.js

Le projet fonctionne avec n'importe quel hébergeur supportant Node.js. La base SQLite locale (`file:./prisma/dev.db`) convient pour un usage mono-utilisateur.

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
- PWA pour usage mobile offline
- Notifications / rappels de saisie
- Catégories de symptômes personnalisables
- Corrélations entre symptômes
- Export PDF pour partage avec un médecin
