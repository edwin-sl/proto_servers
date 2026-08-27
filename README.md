# Multi-Protocol Node.js Server

This project starts a Node.js server that exposes the following protocols:

- REST API on port 3000
- WebSocket server on port 8080 at `/ws`
- gRPC server on port 50051
- GraphQL server on port 3000 at `/graphql`
- MQTT client that subscribes/publishes to a Mosquitto broker on `mqtt://localhost:1883`

The application stores student connection data in an in-memory array instead of a database and logs every incoming request and outgoing response.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Make sure a Mosquitto broker is running locally before starting the MQTT client.

## Student tracking endpoints

### REST

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/students/register \
  -H "Content-Type: application/json" \
  -d '{"protocol":"REST","studentId":"S100","name":"Ana","email":"ana@example.com"}'
curl http://localhost:3000/students
```

### GraphQL

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { registerStudent(protocol: \"GraphQL\", studentId: \"G100\", name: \"Luis\", email: \"luis@example.com\") { studentId name protocol } }"}'
```

### WebSocket

```js
const WebSocket = require('ws');
const socket = new WebSocket('ws://localhost:8080/ws');

socket.on('open', () => {
  socket.send(JSON.stringify({
    action: 'register',
    studentId: 'W100',
    name: 'Maria',
    email: 'maria@example.com'
  }));
});

socket.on('message', (data) => {
  console.log(data.toString());
});
```

### gRPC

```bash
node -e "const grpc = require('@grpc/grpc-js'); const protoLoader = require('@grpc/proto-loader'); const path = require('path'); const pkg = protoLoader.loadSync(path.join(__dirname, 'src/protos/hello.proto'), { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }); const Greeter = grpc.loadPackageDefinition(pkg).helloworld.Greeter; const client = new Greeter('localhost:50051', grpc.credentials.createInsecure()); client.RegisterStudent({ protocol: 'gRPC', studentId: 'G100', name: 'Luis', email: 'luis@example.com' }, (err, res) => { if (err) throw err; console.log(res); });"
```

### MQTT

```js
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  client.subscribe('proto_servers/students');
  client.publish('proto_servers/students', JSON.stringify({
    action: 'register',
    studentId: 'M100',
    name: 'Nora',
    email: 'nora@example.com'
  }));
});

client.on('message', (topic, message) => {
  console.log(topic, message.toString());
});
```

## Notes

- The server is intentionally simple and designed for local development and learning.
- Student connection data is kept in `src/studentStore.js` as an in-memory array.
- The MQTT implementation is a subscriber/publisher only; it does not start a broker.
- You can change the ports by setting environment variables such as `HTTP_PORT`, `WS_PORT`, `GRPC_PORT`, and `MQTT_PORT`.
