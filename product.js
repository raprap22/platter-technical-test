const express = require('express');
const { Pool } = require('pg');
const amqp = require('amqplib');

const app = express();
const port = 9301;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

app.post('/product/check-out', async (req, res) => {
  const client = await pool.connect();
  try {
    const { productId, qty, userId } = req.body;
    await client.query('BEGIN');

    // Update product
    const productResult = await client.query(
      'UPDATE product SET qty = qty - $1 WHERE id = $2 RETURNING *',
      [qty, productId]
    );

    if (productResult.rows.length === 0) {
      throw new Error('Product not found');
    }

    // Message to
    const conn = await amqp.connect('amqp://rabbitmq');
    const channel = await conn.createChannel();
    await channel.assertQueue('paymentQueue');
    channel.sendToQueue(
      'paymentQueue',
      Buffer.from(
        JSON.stringify({
          productId,
          userId,
          qty,
          price: productResult.rows[0].price,
        })
      )
    );

    await client.query('COMMIT');
    res.status(200).send('Product checked out and payment initiated');
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Product service running on port ${port}`);
});