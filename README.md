# Makeprops

Application de gestion des utilisateurs composée d’une API Node.js/Express en TypeScript et d’un client React/TypeScript. SQLite sert de stockage local. La documentation OpenAPI est disponible avec Swagger UI.

## Démarrer en local

Utilisez deux terminaux depuis la racine du dépôt.

**Terminal 1 — API :**

```powershell
npm install
npm run db:seed
npm run dev
```

L’API démarre sur `http://localhost:3000`. La base `data/app.sqlite` et le dossier de photos `data/uploads/users` sont créés automatiquement. Le seed fournit le compte de test `test@example.com` avec le mot de passe `Makeprops-Test-User-2026!`.

**Terminal 2 — React :**

```powershell
cd frontend
npm install
npm run dev
```

Ouvrez l’adresse affichée par Vite, généralement `http://localhost:5173`. Le serveur de développement transmet `/user`, `/health`, `/api-docs` et `/uploads` à l’API locale. Vous pouvez aussi ouvrir Swagger directement sur `http://localhost:3000/api-docs`.

## Fonctionnalités

- Connexion et création de compte; le JWT est conservé dans `localStorage` et les pages de gestion sont protégées.
- Annuaire avec recherche par nom, prénom ou email, pagination, états de chargement et messages d’erreur.
- Modification d’un utilisateur, suppression avec confirmation et édition du profil connecté.
- Inscription avec 1 à 5 photos JPEG, PNG ou WebP, limitées à 5 Mo chacune.
- Les photos sont stockées sous des noms aléatoires dans `data/uploads/users` et leur téléchargement exige un jeton Bearer.
- `/health`, `/api-docs` et `/api-docs.json` sont publics; les routes `/user` sont protégées sauf `POST /user/login` et `POST /user/register`.

Le jeton d’accès expire après 15 minutes. Une nouvelle connexion est alors nécessaire.

## Routes utilisateur

| Méthode | Route | Fonction |
| --- | --- | --- |
| `POST` | `/user/register` | Création de compte en `multipart/form-data` |
| `POST` | `/user/login` | Connexion et émission d’un JWT |
| `GET` | `/user/list?page=1&limit=10` | Liste paginée |
| `GET` | `/user/search?q=martin&page=1&limit=10` | Recherche paginée |
| `GET` | `/user/get?id=1` | Détail utilisateur |
| `PUT` | `/user/update?id=1` | Modification utilisateur |
| `DELETE` | `/user/delete?id=1` | Suppression utilisateur et de ses photos |
| `GET` | `/user/me` | Profil authentifié |
| `PUT` | `/user/me` | Modification du profil authentifié |

Les routes privées attendent `Authorization: Bearer <token>`. Les détails des schémas et réponses sont documentés dans Swagger UI.

## Variables d’environnement

L’API lit le fichier `.env` à la racine du dépôt (voir `.env.example`). `JWT_SECRET` doit contenir au moins 32 octets et être défini en production. En développement, en son absence, une clé temporaire est générée et les jetons sont invalidés au redémarrage. `PORT` vaut `3000` par défaut, `DATABASE_PATH` vaut `./data/app.sqlite` et `UPLOADS_DIR` vaut `./data/uploads/users`.

Le client peut être configuré avec `frontend/.env.local` : `VITE_API_PROXY_TARGET` change la cible du proxy Vite; `VITE_API_URL` définit une URL de base pour le navigateur. Pour une API sur une autre origine, configurez aussi CORS côté serveur ou faites passer les deux applications par un même proxy.

## Vérifications

Depuis la racine :

```powershell
npm run build
npm test
```

Pour compiler le frontend :

```powershell
cd frontend
npm run build
```

## Architecture

```text
src/
  app.ts                         # Assemblage Express
  auth/                          # JWT, vérification et mots de passe
  docs/openapi.ts                # Contrat OpenAPI pour Swagger UI
  domain/                        # Modèle utilisateur et erreurs métier
  infrastructure/
    fileSystem/                  # Stockage contrôlé des photos
    sqlite/                      # Connexion, migration et repository SQLite
  middleware/                    # Authentification, upload et erreurs HTTP
  routes/users.ts                # Adaptation HTTP des routes utilisateur
  users/                         # Services et validation métier
  server.ts                      # Configuration et démarrage
tests/                           # Tests d’intégration API et migration
frontend/src/
  app/                           # Routes et shell de l’application
  features/auth/                 # Contexte, login et inscription
  features/users/                # Annuaire, profil, édition et images privées
  lib/api/                       # Client HTTP centralisé
  types/                         # Contrats du frontend
```
