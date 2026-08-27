const express = require('express');
const { registerStudent, getStudents, getStudentByStudentId, removeStudentByStudentId } = require('../../studentStore');
const { logRequest, logResponse } = require('../../logger');

function createApp() {
  const app = express();
  app.use(express.json());

  const HTTP_PORT = Number(process.env.HTTP_PORT || 3000);
  const WS_PORT = Number(process.env.WS_PORT || 8080);
  const GRPC_PORT = Number(process.env.GRPC_PORT || 50051);
  const MQTT_PORT = Number(process.env.MQTT_PORT || 1883);

  app.use((req, res, next) => {
    const route = `${req.method} ${req.path}`;
    logRequest(route, { query: req.query, body: req.body || null });

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      logResponse(route, { status: res.statusCode || 200, payload });
      return originalJson(payload);
    };

    const originalSend = res.send.bind(res);
    res.send = (payload) => {
      if (typeof payload === 'string') {
        try {
          logResponse(route, { status: res.statusCode || 200, payload: JSON.parse(payload) });
        } catch (error) {
          logResponse(route, { status: res.statusCode || 200, payload });
        }
      } else {
        logResponse(route, { status: res.statusCode || 200, payload });
      }
      return originalSend(payload);
    };

    next();
  });

  app.get('/', (req, res) => {
    res.json({
      service: 'proto_servers',
      protocols: ['REST', 'WebSocket', 'gRPC', 'GraphQL', 'MQTT'],
      endpoints: {
        rest: `http://localhost:${HTTP_PORT}`,
        ws: `ws://localhost:${WS_PORT}/ws`,
        grpc: `localhost:${GRPC_PORT}`,
        graphql: `http://localhost:${HTTP_PORT}/graphql`,
        mqtt: `mqtt://localhost:${MQTT_PORT}`
      }
    });
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/students', (req, res) => {
    res.json({ students: getStudents(), count: getStudents().length });
  });

  app.get('/students/:studentId', (req, res) => {
    const { studentId } = req.params;
    const student = getStudentByStudentId(studentId);
    res.json({ student });
  });

  app.post('/students', (req, res) => {
    const payload = req.body || {};
    const student = registerStudent({
      protocol: payload.protocol || 'REST',
      id: payload.id,
      name: payload.name,
      email: payload.email,
      connectionId: payload.connectionId || `rest-${Date.now()}`
    });
    res.json({ ok: true, student, students: getStudents() });
  });

  app.delete('/students/:studentId', (req, res) => {
    const removed = removeStudentByStudentId(req.params.studentId);
    res.json({ ok: true, removed, students: getStudents() });
  });

  app.post('/echo', (req, res) => {
    const payload = req.body || {};
    res.json({
      received: payload,
      message: 'REST request received successfully'
    });
  });

  return app;
}

module.exports = { createApp };
