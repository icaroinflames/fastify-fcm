# Fastify FCM

Fastify FCM is a library for Fastify that allows sending notifications via Firebase Cloud Messaging (FCM).

## Installation

To install Fastify FCM in your project, run the following command:

```bash
npm install @icaroinflames/fastify-fcm
```

## Usage

First, you must register the plugin on your Fastify server and provide the right options:

```javascript
const fastify = require("fastify")();
const fastifyFcm = require("fastify-fcm");

fastify.register(fastifyFcm, {
  project_id: "your-project-12345",
  private_key: "your private key",
  client_email: "your client email
});
```

The options can be obtained from the `service account` file. The plugin will decorate the fastify instance with the `fcm.send` function. you can use it to send notification to tokens or topics:

```javascript
const responses = await fastify.fcm.send({
  tokens: ["a_registration_token", "another_registration_token"],
  topic: "a topic name",
  message:
    notification: {
        title: "Título de la notificación",
        body: "Cuerpo de la notificación",
    },
    data: {
        key1: "a value",
        key2: 23,
        key3: {key32: "another value"}
    }
});
```

The response contains the responses of all the calls to tokens and topic

## Contributions

Contributions are welcome. Please open an issue or a pull request if you have something to add.

## License

Fastify FCM is licensed under the MIT license.
