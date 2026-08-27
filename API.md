# Client API Documentation

This service exposes the same student data through multiple protocols:

- REST over HTTP
- GraphQL over HTTP
- WebSocket
- gRPC
- MQTT

All protocols operate against the same in-memory student store. There is no authentication or authorization layer.

## Connection details

Defaults:
- HTTP / REST / GraphQL base URL: http://localhost:3000
- WebSocket URL: ws://localhost:8080/ws
- gRPC host: localhost:50051
- MQTT broker: mqtt://localhost:1883

Environment variables:
- HTTP_PORT
- WS_PORT
- GRPC_PORT
- MQTT_URL
- MQTT_PORT

## Student model

A student record has this structure:

```json
{
  "id": "string",
  "name": "string",
  "email": "string | null",
  "connectionId": "string | null",
  "connectedAt": "ISO timestamp"
}
```

Notes:
- The service stores students in memory only.
- `id` is the canonical identifier used by the app.
- The protocol used to register does not identify the student.

## REST API

Base URL:
- http://localhost:3000

### 1) GET /health
Returns service health.

Example response:

```json
{
  "status": "ok",
  "timestamp": "2026-08-27T00:00:00.000Z"
}
```

### 2) GET /students
Returns all students.

Example response:

```json
{
  "students": [
    {
      "id": "S100",
      "name": "Ana",
      "email": "ana@example.com",
      "connectionId": "rest-1",
      "connectedAt": "2026-08-27T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### 3) GET /students/{id}
Returns one student by ID.

Example response:

```json
{
  "student": {
    "id": "S100",
    "name": "Ana",
    "email": "ana@example.com",
    "connectionId": "rest-1",
    "connectedAt": "2026-08-27T00:00:00.000Z"
  }
}
```

### 4) POST /students
Registers a student.

Request body:

```json
{
  "id": "S100",
  "name": "Ana",
  "email": "ana@example.com"
}
```

Response:

```json
{
  "ok": true,
  "student": {
    "id": "S100",
    "name": "Ana",
    "email": "ana@example.com",
    "connectionId": "rest-1",
    "connectedAt": "2026-08-27T00:00:00.000Z"
  },
  "students": [
    {
      "id": "S100",
      "name": "Ana",
      "email": "ana@example.com",
      "connectionId": "rest-1",
      "connectedAt": "2026-08-27T00:00:00.000Z"
    }
  ]
}
```

### 5) DELETE /students/{id}
Deletes a student by ID.

Response:

```json
{
  "ok": true,
  "removed": {
    "id": "S100",
    "name": "Ana",
    "email": "ana@example.com",
    "connectionId": "rest-1",
    "connectedAt": "2026-08-27T00:00:00.000Z"
  },
  "students": []
}
```

## GraphQL API

Endpoint:
- http://localhost:3000/graphql

### Queries
- students
- hello
- status

### Mutation
- registerStudent(id: String!, name: String, email: String, connectionId: String): Student

Example query:

```graphql
{
  students {
    id
    name
    email
    connectionId
    connectedAt
  }
}
```

Example mutation:

```graphql
mutation {
  registerStudent(id: "G100", name: "Luis", email: "luis@example.com") {
    id
    name
    email
  }
}
```

## WebSocket API

Endpoint:
- ws://localhost:8080/ws

Messages are JSON. The client can send:
- action: "register"
- action: "getStudents"

### Register message

```json
{
  "action": "register",
  "id": "W100",
  "name": "Maria",
  "email": "maria@example.com"
}
```

### Get students message

```json
{
  "action": "getStudents"
}
```

Server responses may include:
- type: "welcome"
- type: "studentRegistered"
- type: "students"
- type: "studentUpdated"
- type: "studentDisconnected"
- type: "error"

## gRPC API

Proto package:
- studentcrud

Service:
- StudentCRUD

RPCs:
- RegisterStudent
- GetStudents
- GetStudent

Messages:

### StudentInfo

```proto
message StudentInfo {
  string id = 1;
  string name = 2;
  string email = 3;
}
```

### StudentFilter

```proto
message StudentFilter {
  string id = 1;
}
```

### StudentIdRequest

```proto
message StudentIdRequest {
  string id = 1;
}
```

### StudentRecord

```proto
message StudentRecord {
  string id = 1;
  string name = 2;
  string email = 3;
  string connectionId = 4;
  string connectedAt = 5;
}
```

### StudentListReply

```proto
message StudentListReply {
  repeated StudentRecord students = 1;
}
```

Example semantics:
- RegisterStudent creates or updates by `id`
- GetStudents returns all students or filters by `id`
- GetStudent gets one specific student by `id`

## MQTT API

Broker:
- mqtt://localhost:1883 or MQTT_URL + MQTT_PORT

Topic:
- students

Messages sent to the broker:
- register
- getStudents

### Register payload

```json
{
  "action": "register",
  "id": "M100",
  "name": "Nora",
  "email": "nora@example.com"
}
```

### Get students payload

```json
{
  "action": "getStudents"
}
```

Server response topic:
- students/response

Example response:

```json
{
  "type": "studentRegistered",
  "student": {
    "id": "M100",
    "name": "Nora",
    "email": "nora@example.com",
    "connectionId": "mqtt-123",
    "connectedAt": "2026-08-27T00:00:00.000Z"
  },
  "students": [
    {
      "id": "M100",
      "name": "Nora",
      "email": "nora@example.com",
      "connectionId": "mqtt-123",
      "connectedAt": "2026-08-27T00:00:00.000Z"
    }
  ]
}
```

## Error handling

General behaviors:
- Missing or invalid action: server returns an error payload
- Student not found:
  - REST: `student` is `null`
  - gRPC: empty response object / no record
  - GraphQL: `null`
- There is no strong validation beyond basic request shape checks

## Notes for clients

- No authentication is required in the current implementation.
- Data is stored in memory, so it resets when the process restarts.
- Use the same connection ID semantics consistently if your client is sending them.
- For remote deployment, make sure the relevant ports are opened in the firewall and the host binding is reachable.
