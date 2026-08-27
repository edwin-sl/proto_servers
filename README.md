# Multi-Protocol Student Server

This project exposes the same in-memory student store through multiple protocols:

- REST over HTTP
- GraphQL on the same HTTP server at `/graphql`
- WebSocket at `/ws`
- gRPC using `src/protos/student_crud.proto`
- MQTT publish/subscribe client

Data is stored in memory in `src/studentStore.js`, and all requests/responses are logged by `src/logger.js`.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

By default the services start with:

- HTTP/REST + GraphQL: `http://localhost:3000`
- WebSocket: `ws://localhost:8080/ws`
- gRPC: `localhost:50051`
- MQTT: `mqtt://localhost:1883`

## Environment variables

The server reads these environment variables:

```bash
HTTP_PORT=3000
WS_PORT=8080
GRPC_PORT=50051
MQTT_URL=mqtt://localhost
MQTT_PORT=1883
```

Notes:
- GraphQL uses the same HTTP port as REST.
- The MQTT broker URL is built from `MQTT_URL` and `MQTT_PORT` in `src/servers/mqtt/index.js`.

## REST API

Base URL: `http://localhost:3000`

### Health

```bash
curl http://localhost:3000/health
```

### Get all students

```bash
curl http://localhost:3000/students
```

### Get one student by ID

```bash
curl http://localhost:3000/students/12345
```

### Register a student

```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{
    "id": "S100",
    "name": "Ana",
    "email": "ana@example.com",
    "connectionId": "rest-1"
  }'
```

### Delete a student

```bash
curl -X DELETE http://localhost:3000/students/S100
```

### Echo

```bash
curl -X POST http://localhost:3000/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"hello"}'
```

## GraphQL

GraphQL is mounted at `http://localhost:3000/graphql`.

### Query students

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ students { id name email connectionId connectedAt } }"
  }'
```

### Register a student

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { registerStudent(id: \"G100\", name: \"Luis\", email: \"luis@example.com\") { id name email } }"
  }'
```

## WebSocket

Endpoint: `ws://localhost:8080/ws`

Client example:

```js
const WebSocket = require('ws');
const socket = new WebSocket('ws://localhost:8080/ws');

socket.on('open', () => {
  socket.send(JSON.stringify({
    action: 'register',
    id: 'W100',
    name: 'Maria',
    email: 'maria@example.com'
  }));
});

socket.on('message', (data) => {
  console.log(data.toString());
});
```

Supported actions:
- `register`
- `getStudents`

## gRPC

Proto file: `src/protos/student_crud.proto`

Service: `studentcrud.StudentCRUD`

Available RPCs:
- `RegisterStudent`
- `GetStudents`
- `GetStudent`

Example with Node.js:

```bash
node -e "const grpc = require('@grpc/grpc-js'); const protoLoader = require('@grpc/proto-loader'); const path = require('path'); const pkg = protoLoader.loadSync(path.join(__dirname, 'src/protos/student_crud.proto'), { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }); const StudentCRUD = grpc.loadPackageDefinition(pkg).studentcrud.StudentCRUD; const client = new StudentCRUD('localhost:50051', grpc.credentials.createInsecure()); client.RegisterStudent({ id: 'G100', name: 'Luis', email: 'luis@example.com' }, (err, res) => { if (err) throw err; console.log(res); });"
```

## MQTT

The app connects to a broker as a client and subscribes to the `students` topic.

Example:

```js
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  client.subscribe('students');
  client.publish('students', JSON.stringify({
    action: 'register',
    id: 'M100',
    name: 'Nora',
    email: 'nora@example.com'
  }));
});

client.on('message', (topic, message) => {
  console.log(topic, message.toString());
});
```

Supported MQTT actions:
- `register`
- `getStudents`

The response is published to the `students/response` topic.

## Notes

- The server is intentionally simple and intended for local development and learning.
- Student data is kept in memory inside `src/studentStore.js`.
- The project does not start its own MQTT broker; it connects to an external broker.
- The server binds to `0.0.0.0` for gRPC and HTTP services, so it can accept remote connections when the network/firewall allows it.
