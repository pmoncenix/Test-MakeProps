export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Makeprops API",
    version: "1.0.0",
    description: "Documentation de l’API Makeprops.",
  },
  paths: {
    "/user/get": {
      get: {
        summary: "Récupérer un utilisateur par son identifiant",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            description: "Identifiant entier positif de l’utilisateur.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "200": {
            description: "Utilisateur trouvé.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "name", "email"],
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "Alex Martin" },
                    email: { type: "string", format: "email", example: "alex@example.com" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Identifiant absent ou invalide.",
          },
          "404": {
            description: "Aucun utilisateur ne correspond à cet identifiant.",
          },
          "500": {
            description: "Erreur interne du serveur.",
          },
        },
      },
    },
    "/user/list": {
      get: {
        summary: "Récupérer la liste paginée des utilisateurs",
        tags: ["Users"],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page (par défaut : 1).",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre d’utilisateurs par page (par défaut : 10, maximum : 100).",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Page d’utilisateurs récupérée.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["users", "pagination"],
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["id", "name", "email"],
                        properties: {
                          id: { type: "integer", example: 1 },
                          name: { type: "string", example: "Alex Martin" },
                          email: { type: "string", format: "email", example: "alex@example.com" },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      required: ["page", "limit", "total", "totalPages"],
                      properties: {
                        page: { type: "integer", example: 1 },
                        limit: { type: "integer", example: 10 },
                        total: { type: "integer", example: 24 },
                        totalPages: { type: "integer", example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Paramètres de pagination invalides." },
          "500": { description: "Erreur interne du serveur." },
        },
      },
    },
    "/user/search": {
      get: {
        summary: "Rechercher des utilisateurs par nom, prénom ou email",
        tags: ["Users"],
        parameters: [
          {
            name: "q",
            in: "query",
            required: true,
            description: "Terme recherché dans le prénom, le nom ou l’adresse email.",
            schema: { type: "string", minLength: 1, maxLength: 100, example: "martin" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Numéro de page (par défaut : 1).",
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Nombre d’utilisateurs par page (par défaut : 10, maximum : 100).",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: {
          "200": {
            description: "Résultats de recherche paginés.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["users", "pagination"],
                  properties: {
                    users: {
                      type: "array",
                      items: {
                        type: "object",
                        required: ["id", "name", "email"],
                        properties: {
                          id: { type: "integer" },
                          name: { type: "string" },
                          email: { type: "string", format: "email" },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      required: ["page", "limit", "total", "totalPages"],
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        totalPages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Terme de recherche ou paramètres de pagination invalides." },
          "500": { description: "Erreur interne du serveur." },
        },
      },
    },
    "/user/update": {
      put: {
        summary: "Modifier un utilisateur par son identifiant",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            description: "Identifiant entier positif de l’utilisateur.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string", minLength: 1, example: "Alex Martin" },
                  email: { type: "string", format: "email", example: "alex@example.com" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Utilisateur modifié.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["id", "name", "email"],
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "Alex Martin" },
                    email: { type: "string", format: "email", example: "alex@example.com" },
                  },
                },
              },
            },
          },
          "400": { description: "Identifiant, JSON ou champs invalides." },
          "404": { description: "Aucun utilisateur ne correspond à cet identifiant." },
          "409": { description: "L’adresse email est déjà utilisée." },
          "500": { description: "Erreur interne du serveur." },
        },
      },
    },
    "/user/delete": {
      delete: {
        summary: "Supprimer un utilisateur par son identifiant",
        tags: ["Users"],
        parameters: [
          {
            name: "id",
            in: "query",
            required: true,
            description: "Identifiant entier positif de l’utilisateur.",
            schema: { type: "integer", minimum: 1 },
          },
        ],
        responses: {
          "204": { description: "Utilisateur supprimé." },
          "400": { description: "Identifiant absent ou invalide." },
          "404": { description: "Aucun utilisateur ne correspond à cet identifiant." },
          "500": { description: "Erreur interne du serveur." },
        },
      },
    },
  },
} as const;
