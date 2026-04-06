/**
 * Nova AI – Netlify Serverless API
 *
 * Environment variables to set in Netlify dashboard:
 *   DATABASE_URL  – PostgreSQL connection string (e.g. from Neon, Supabase, Railway)
 *   OPENAI_API_KEY – Your OpenAI API key (https://platform.openai.com/api-keys)
 */

import OpenAI from "openai";
import pg from "pg";

const { Pool } = pg;

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function ensureTables(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'New Chat',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function json(body, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}

function cors() {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: "",
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return cors();

  const rawPath = event.path || "";
  const path = rawPath.replace(/^\/.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";
  const method = event.httpMethod;

  const db = getPool();
  const client = await db.connect();

  try {
    await ensureTables(client);

    // GET /conversations
    if (method === "GET" && path === "/openai/conversations") {
      const { rows } = await client.query(
        "SELECT * FROM conversations ORDER BY created_at DESC"
      );
      return json(rows.map(camel));
    }

    // POST /conversations
    if (method === "POST" && path === "/openai/conversations") {
      const body = JSON.parse(event.body || "{}");
      const { rows } = await client.query(
        "INSERT INTO conversations (title) VALUES ($1) RETURNING *",
        [body.title || "New Chat"]
      );
      return json(camel(rows[0]), 201);
    }

    // DELETE /conversations/:id
    const delMatch = path.match(/^\/openai\/conversations\/(\d+)$/);
    if (method === "DELETE" && delMatch) {
      const id = parseInt(delMatch[1]);
      await client.query("DELETE FROM conversations WHERE id=$1", [id]);
      return { statusCode: 204, body: "" };
    }

    // GET /conversations/:id
    const getMatch = path.match(/^\/openai\/conversations\/(\d+)$/);
    if (method === "GET" && getMatch) {
      const id = parseInt(getMatch[1]);
      const { rows: convRows } = await client.query("SELECT * FROM conversations WHERE id=$1", [id]);
      if (!convRows.length) return json({ error: "Not found" }, 404);
      const { rows: msgRows } = await client.query(
        "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC", [id]
      );
      return json({ ...camel(convRows[0]), messages: msgRows.map(camel) });
    }

    // POST /conversations/:id/messages
    const msgMatch = path.match(/^\/openai\/conversations\/(\d+)\/messages$/);
    if (method === "POST" && msgMatch) {
      const id = parseInt(msgMatch[1]);
      const body = JSON.parse(event.body || "{}");
      const userContent = body.content || "";

      const { rows: convRows } = await client.query("SELECT * FROM conversations WHERE id=$1", [id]);
      if (!convRows.length) return json({ error: "Not found" }, 404);

      const { rows: history } = await client.query(
        "SELECT * FROM messages WHERE conversation_id=$1 ORDER BY created_at ASC", [id]
      );

      await client.query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
        [id, "user", userContent]
      );

      const chatMessages = [
        {
          role: "system",
          content:
            "You are a highly capable AI assistant. Answer every question clearly, accurately, and helpfully. Respond conversationally like ChatGPT. Support all topics: knowledge, coding, creative writing, math, science. Format with markdown when helpful. Never refuse without good reason.",
        },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userContent },
      ];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: chatMessages,
        max_tokens: 4096,
      });

      const assistantContent = completion.choices[0]?.message?.content || "";

      await client.query(
        "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
        [id, "assistant", assistantContent]
      );

      if (!history.length) {
        await client.query(
          "UPDATE conversations SET title=$1, updated_at=NOW() WHERE id=$2",
          [userContent.slice(0, 60), id]
        );
      }

      return json({ content: assistantContent, done: true });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    console.error("API error:", err);
    return json({ error: "Internal server error", detail: err.message }, 500);
  } finally {
    client.release();
  }
};

function camel(row) {
  if (!row) return row;
  const out = {};
  for (const key of Object.keys(row)) {
    out[key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = row[key];
  }
  return out;
}
