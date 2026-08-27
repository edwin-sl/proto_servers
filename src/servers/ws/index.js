const { WebSocketServer } = require('ws');
const { registerStudent, getStudents, removeStudentByConnectionId } = require('../../studentStore');
const { logRequest, logResponse } = require('../../logger');

function parseMessage(raw) {
  try {
    const text = raw.toString();
    return JSON.parse(text);
  } catch (error) {
    return { action: 'message', raw: raw.toString() };
  }
}

function broadcast(wss, payload) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
}

function start(ports = {}) {
  const WS_PORT = Number(ports.WS_PORT || process.env.WS_PORT || 8080);
  const wss = new WebSocketServer({ port: WS_PORT, path: '/ws' });

  wss.on('connection', (socket) => {
    const connectionId = `ws-${Date.now()}`;
    socket.connectionId = connectionId;

    socket.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to WebSocket server',
      connectionId,
      students: getStudents('WEBSOCKET')
    }));

    socket.on('message', (raw) => {
      const payload = parseMessage(raw);
      logRequest('WebSocket message', payload);

      if (!payload || !payload.action) {
        const response = { type: 'error', message: 'Action required.' };
        logResponse('WebSocket message', response);
        socket.send(JSON.stringify(response));
        return;
      }

      if (payload.action === 'register') {
        const student = registerStudent({
          protocol: 'WEBSOCKET',
          connectionId,
          id: payload.id,
          name: payload.name,
          email: payload.email,
          metadata: { remoteAddress: socket._socket ? socket._socket.remoteAddress : 'unknown' }
        });

        const response = { type: 'studentRegistered', student, students: getStudents('WEBSOCKET') };
        logResponse('WebSocket register', response);
        socket.send(JSON.stringify(response));
        broadcast(wss, { type: 'studentUpdated', student, students: getStudents('WEBSOCKET') });
        return;
      }

      if (payload.action === 'getStudents') {
        const response = { type: 'students', students: getStudents('WEBSOCKET') };
        logResponse('WebSocket list', response);
        socket.send(JSON.stringify(response));
        return;
      }

      const response = {
        type: 'message',
        data: payload,
        receivedAt: new Date().toISOString(),
        students: getStudents('WEBSOCKET')
      };
      logResponse('WebSocket echo', response);
      broadcast(wss, response);
    });

    socket.on('close', () => {
      const removed = removeStudentByConnectionId(connectionId);
      if (removed) {
        const response = { type: 'studentDisconnected', student: removed, students: getStudents('WEBSOCKET') };
        logResponse('WebSocket disconnect', response);
        broadcast(wss, response);
      }
    });
  });

  console.log(`WebSocket server listening on ws://localhost:${WS_PORT}/ws`);
  return wss;
}

module.exports = { start };
