import app from "../api-server/src/app";
import { connectToDatabase } from "../api-server/src/lib/mongodb";

export default async function handler(req: any, res: any) {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error("[Vercel API] Database connection error:", err);
  }
  return app(req, res);
}
