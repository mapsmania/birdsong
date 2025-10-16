// netlify/functions/xeno.js
import fetch from "node-fetch";

export async function handler(event, context) {
  const query = event.queryStringParameters?.query;
  if (!query) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing query parameter" }),
    };
  }

  const key = process.env.XENO_KEY; // Keep your key in environment variables
  const url = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(query)}&key=${key}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
