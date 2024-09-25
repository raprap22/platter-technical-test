const express = require('express');
const amqp = require('amqplib');

const app = express();
const port = 9304;

async function sendNotification() {
  const conn = await amqp.connect('amqp://rabbitmq');
  const channel = await conn.createChannel();
  await channel.assertQueue('notificationQueue');

  channel.consume('notificationQueue', (msg) => {
    const notification = JSON.parse(msg.content.toString());
    notifyUser(notification);
  }, { noAck: true });
}

app.listen(port, async () => {
  console.log(`Notification service running on port ${port}`);
  await sendNotification();
});