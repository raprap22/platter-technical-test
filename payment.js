const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');

const app = express();
const port = 9302;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

async function processPayment() {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue('paymentQueue');

  channel.consume('paymentQueue', async (msg) => {
    const { productId, userId, qty, price } = JSON.parse(msg.content.toString());
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const bill = qty * price;

      // Insert payment
      await client.query(
        'INSERT INTO payment (productId, userId, qty, price, bill, paymentAt) VALUES ($1, $2, $3, $4, $5, NOW())',
        [productId, userId, qty, price, bill]
      );

      // notification
      const notificationChannel = await conn.createChannel();
      await notificationChannel.assertQueue('notificationQueue');
      notificationChannel.sendToQueue(
        'notificationQueue',
        Buffer.from(JSON.stringify({ productId, userId, qty, bill }))
      );

      await client.query('COMMIT');
      console.log('Payment processed and notification sent');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Payment failed:', err);
    } finally {
      client.release();
    }
  }, { noAck: true });
}

app.listen(port, async () => {
  console.log(`Payment service running on port ${port}`);
  await processPayment();
});