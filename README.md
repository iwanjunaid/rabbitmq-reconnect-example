# rabbitmq-reconnect-example
Simple implementation how to manage connection failure in RabbitMQ using AMQPLib in Node.JS

## Preface
It is a mandatory for an application to handle various errors that happen in runtime such as when a connection to a resource (server) is closed or failed suddenly. This repo shows you an example how to implement auto reconnect to handle connection failure on RabbitMQ server in Node.JS. The example uses callback-style API of [AMQPLib](https://github.com/squaremo/amqp.node).

## How it works
To implement auto reconnect mechanism, you need to have your connection code in a separate function and provide a callback as the parameter of the function. This callback will be useful for supplying error or successfuly created channel object to the caller of 'connection' function once the connection is failed or successful. You may also add another parameter to specify the interval of the next reconnection will be invoked in ms.

```javascript
function connect(interval, callback) {}
```

Connection errors or failures could come from two different  point of failures. The first one is the error that comes from the first connection attempt. The last one is a failure that happens in the middle of an application runtime.

To handle the error that comes from the first connection attempt, you need to check whether the first param of callback of AMQP connection is an error object or not. If error occurs, you need to recall connect function again using setTimeout api. This function will be invoked and invoked again until the connection is established successfuly.

```javascript
function connect(interval, callback) {
	amqp.connect('amqp://localhost', (err, conn) => {
		if (err) {
			console.log('Cannot connect to RabbitMQ server! Retrying to connect...');
		
			return setTimeout(connect.bind(null, interval, callback), interval);
		}
	});
		
}
``` 

 To handle the second point of failure that could happen in the middle of application runtime, you need to listen on 'close' event of the connection object. If there is a close event with error code 320 then you need to recall the connect function again using setTimeout api.
 
```javascript
function connect(interval, callback) {
	amqp.connect('amqp://localhost', (err, conn) => {
		if (err) {
			...
		}
		
		conn.on('close', (err) => {
			if (err.code == 320) {
				console.log('Connection to server closed!');
				callback(new Error('connection closed'), null);
				
				return setTimeout(connect.bind(null, interval, callback), interval);
			}
		});
	});
		
}
```

Last step is to call the connect's callback and supply it with the channel created after connection successfuly established.

```javascript
function connect(interval, callback) {
	amqp.connect('amqp://localhost', (err, conn) => {
		if (err) {
			...
		}
		
		conn.on('close', (err) => {
			...
		});
		
		console.log('Connected to RabbitMQ server!');
		
		conn.createChannel((err, channel) => {
			return callback(err, channel);
		});
	});
}
```

Here is the complete code of the example.

```javascript
const amqp = require('amqplib/callback_api');

function connect(interval, callback) {
  amqp.connect('amqp://localhost', (err, conn) => {
    if (err) {
      console.log('Cannot connect to to RabbitMQ server! Retrying to connect...');

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
```