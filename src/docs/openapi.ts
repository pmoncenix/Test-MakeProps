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
  },
} as const;
