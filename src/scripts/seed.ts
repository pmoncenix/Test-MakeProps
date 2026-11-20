import "dotenv/config";
import { openDatabase } from "../infrastructure/sqlite/database.js";

const databasePath = process.env.DATABASE_PATH ?? "./data/app.sqlite";
const database = openDatabase(databasePath);

try {
  database.prepare(`
    INSERT INTO users (name, email)
    VALUES (?, ?)
    ON CONFLICT(email) DO NOTHING
  `).run("Utilisateur de démonstration", "demo@example.com");

  const user = database.prepare("SELECT id FROM users WHERE email = ?")
    .get("demo@example.com") as { id: number } | undefined;

  if (user) {
    console.log(`Utilisateur de démonstration prêt : GET /user/get?id=${user.id}`);
  }
} finally {
  database.close();
}
