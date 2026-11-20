import "dotenv/config";
import { createAccessTokenService } from "./auth/createAccessTokenService.js";
import { createApp } from "./app.js";
import { openDatabase } from "./infrastructure/sqlite/database.js";
import { SqliteUserRepository } from "./infrastructure/sqlite/SqliteUserRepository.js";
import { UserService } from "./users/userService.js";

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un entier compris entre 1 et 65535.");
}

const databasePath = process.env.DATABASE_PATH ?? "./data/app.sqlite";
const accessTokenService = createAccessTokenService();
const database = openDatabase(databasePath);
const userService = new UserService(
  new SqliteUserRepository(database),
  accessTokenService,
);
const app = createApp(userService, accessTokenService);
const server = app.listen(port, () => {
  console.log(`API Makeprops disponible sur http://localhost:${port}`);
  console.log(`Documentation Swagger : http://localhost:${port}/api-docs`);
});

function shutdown(): void {
  server.close((error) => {
    database.close();
    if (error) {
      console.error("Erreur pendant l’arrêt du serveur :", error);
      process.exitCode = 1;
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
