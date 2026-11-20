# Makeprops API

API REST en Node.js, Express, TypeScript et SQLite.

## Démarrer en développement

```powershell
npm install
npm run db:seed
npm run dev
```

Le serveur utilise le port `3000` et crée `data/app.sqlite` automatiquement. Les variables `PORT` et `DATABASE_PATH` peuvent être définies dans `.env` (voir `.env.example`). La commande `db:seed` ajoute un utilisateur de démonstration sans modifier une entrée déjà présente.

## Récupérer un utilisateur

```text
GET http://localhost:3000/user/get?id=1
```

Exemple avec PowerShell :

```powershell
Invoke-RestMethod "http://localhost:3000/user/get?id=1"
```

La réponse `200` contient `id`, `name` et `email`. Une requête sans identifiant ou avec un identifiant invalide renvoie `400`; un identifiant valide sans utilisateur correspondant renvoie `404`.

## Lister les utilisateurs

```powershell
Invoke-RestMethod "http://localhost:3000/user/list?page=1&limit=10"
```

`page` commence à `1` et `limit` vaut `10` par défaut. La limite maximale est de `100` utilisateurs par page. La réponse contient `users` et `pagination` avec les champs `page`, `limit`, `total` et `totalPages`. Des paramètres invalides renvoient `400`.

## Rechercher des utilisateurs

La route cherche le terme `q` dans le nom complet (prénom et nom) et l’adresse email. La recherche ignore la casse et les accents, et reprend les mêmes paramètres de pagination que `/user/list` :

```powershell
Invoke-RestMethod "http://localhost:3000/user/search?q=martin&page=1&limit=10"
```

Le paramètre `q` est obligatoire et doit contenir de 1 à 100 caractères. Un terme ou des paramètres de pagination invalides renvoient `400`.

## Modifier un utilisateur

`PUT /user/update` utilise le même identifiant en query string. Les champs `name` et `email` sont requis dans le corps JSON :

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:3000/user/update?id=1" `
  -ContentType "application/json" `
  -Body '{"name":"Alex Martin","email":"alex.martin@example.com"}'
```

La réponse `200` contient l’utilisateur modifié. La route renvoie `400` pour un identifiant ou des champs invalides, `404` si l’utilisateur n’existe pas et `409` si l’adresse email est déjà utilisée.

## Supprimer un utilisateur

```powershell
Invoke-RestMethod -Method Delete -Uri "http://localhost:3000/user/delete?id=1"
```

La réponse `204` confirme la suppression sans renvoyer de contenu. La route renvoie `400` si l’identifiant est invalide et `404` si l’utilisateur n’existe pas.

## Documentation et tests

- Swagger UI : `http://localhost:3000/api-docs`
- Spécification OpenAPI JSON : `http://localhost:3000/api-docs.json`
- Tests d’intégration : `npm test`
- Vérification TypeScript : `npm run build`

## Structure

```text
src/
  domain/                  # Modèles du domaine
  docs/                    # Spécification OpenAPI
  errors/                  # Erreurs applicatives
  infrastructure/sqlite/   # Connexion SQLite et dépôt utilisateur
  middleware/              # Middleware Express partagé
  routes/                  # Définition des routes HTTP
  scripts/                 # Commandes locales de démonstration
  users/                   # Service et contrat de dépôt utilisateur
  app.ts                   # Assemblage de l’application Express
  server.ts                # Démarrage du serveur
tests/                     # Tests d’intégration HTTP
```
