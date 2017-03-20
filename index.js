const amqp = require('amqplib/callback_api');

function connect(interval, callback) {
  amqp.connect('amqp://localhost', (err, conn) => {
    if (err) {
      console.log('Cannot connect to RabbitMQ server! Retrying to connect...');

      return setTimeout(connect.bind(null, interval, callback), interval);
    }

    conn.on('close', (err) => {
      if (err.code == 320) {
        console.log('Connection to server closed!');
        callback(new Error('connection closed'), null);

        return setTimeout(connect.bind(null, interval, callback), interval);
      }
    });

    console.log('Connected to RabbitMQ server!');

    conn.createChannel((err, channel) => {
      return callback(err, channel);
    });
  });
}

connect(2000, (err, ch) => {
  if (!err)
    console.log('Yeeehaaa!');
});
