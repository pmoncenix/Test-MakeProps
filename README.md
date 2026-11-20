# Makeprops API

API REST en Node.js, Express, TypeScript et SQLite.

## Démarrer en développement

```powershell
npm install
npm run db:seed
npm run dev
```

Le serveur utilise le port `3000` et crée `data/app.sqlite` automatiquement. Les variables `PORT` et `DATABASE_PATH` peuvent être définies dans `.env` (voir `.env.example`). La commande `db:seed` ajoute un utilisateur de démonstration sans modifier une entrée déjà présente.

Toutes les routes métier `/user` exigent un jeton Bearer, sauf `POST /user/register` et `POST /user/login`. `/health`, `/api-docs` et `/api-docs.json` restent publics.

`npm run db:seed` crée aussi un compte de test local : `test@example.com` / `Makeprops-Test-User-2026!`. Le seed est désactivé lorsque `NODE_ENV=production`.

## Récupérer un utilisateur

```text
GET http://localhost:3000/user/get?id=1
```

Exemple avec PowerShell :

```powershell
Invoke-RestMethod -Headers $headers "http://localhost:3000/user/get?id=1"
```

La réponse `200` contient `id`, `name` et `email`. Une requête sans identifiant ou avec un identifiant invalide renvoie `400`; un identifiant valide sans utilisateur correspondant renvoie `404`.

## Lister les utilisateurs

```powershell
Invoke-RestMethod -Headers $headers "http://localhost:3000/user/list?page=1&limit=10"
```

`page` commence à `1` et `limit` vaut `10` par défaut. La limite maximale est de `100` utilisateurs par page. La réponse contient `users` et `pagination` avec les champs `page`, `limit`, `total` et `totalPages`. Des paramètres invalides renvoient `400`.

## Rechercher des utilisateurs

La route cherche le terme `q` dans le nom complet (prénom et nom) et l’adresse email. La recherche ignore la casse et les accents, et reprend les mêmes paramètres de pagination que `/user/list` :

```powershell
Invoke-RestMethod -Headers $headers "http://localhost:3000/user/search?q=martin&page=1&limit=10"
```

Le paramètre `q` est obligatoire et doit contenir de 1 à 100 caractères. Un terme ou des paramètres de pagination invalides renvoient `400`.

## Créer un compte

```powershell
$registration = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/user/register" `
  -ContentType "application/json" `
  -Body '{"firstName":"Alex","lastName":"Martin","email":"alex@example.com","password":"a memorable passphrase 2026!"}'

$headers = @{ Authorization = "Bearer $($registration.accessToken)" }
```

Le mot de passe doit contenir entre 15 et 128 caractères. Il est stocké sous forme de hash Argon2id et n’apparaît jamais dans la réponse. Le prénom et le nom sont enregistrés séparément en base, tandis que l’API renvoie le champ `name` complet pour rester cohérente avec les autres routes. L’adresse email est normalisée en minuscules; une adresse déjà utilisée renvoie `409`. La réponse contient également un jeton JWT Bearer valable 15 minutes, comme la route de connexion.

## Se connecter

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/user/login" `
  -ContentType "application/json" `
  -Body '{"email":"alex@example.com","password":"a memorable passphrase 2026!"}'

$headers = @{ Authorization = "Bearer $($login.accessToken)" }
```

La réponse contient le profil sans hash et un jeton d’accès JWT `Bearer` valable 15 minutes. Si l’email n’existe pas ou si le mot de passe est faux, l’API renvoie dans les deux cas `401` avec le même message.

La route limite les tentatives à 10 par adresse IP sur une période de 15 minutes; au-delà, elle renvoie `429`.

`JWT_SECRET` doit contenir au moins 32 octets et être défini en production. En développement, s’il est absent, le serveur génère une clé temporaire : les jetons émis deviennent invalides au prochain redémarrage. Pour créer une clé locale dans PowerShell :

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Copie la valeur affichée dans `.env` sous la forme `JWT_SECRET=<valeur>`.

## Modifier un utilisateur

`PUT /user/update` utilise le même identifiant en query string. Les champs `name` et `email` sont requis dans le corps JSON :

```powershell
Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:3000/user/me" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body '{"name":"Alex Martin","email":"alex.martin@example.com"}'
```

`PUT /user/me` met à jour le compte lié au jeton et renvoie le profil modifié. Les routes avec un identifiant explicite restent disponibles aux utilisateurs authentifiés. Les données invalides renvoient `400`; une adresse email déjà utilisée renvoie `409`.

## Supprimer un utilisateur

```powershell
Invoke-RestMethod -Method Delete -Headers $headers -Uri "http://localhost:3000/user/delete?id=1"
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
