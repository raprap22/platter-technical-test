const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');

const app = express();
const port = 2323;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('User connected');
});

export async function notifyUser({ productId, userId, qty, bill }) {
  const client = await pool.connect();

  try {
    const userResult = await client.query('SELECT * FROM public.user WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          productId,
          userId,
          qty,
          bill,
          message: `Hi ${userResult.rows[0].name}, your payment is confirmed!`
        }));
      }
    });

    console.log('Notification sent to user:', userId);
  } catch (err) {
    console.error('Notification failed:', err);
  } finally {
    client.release();
  }
}

app.listen(port, () => {
  console.log(`User service running on port ${port}`);
});