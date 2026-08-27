const mqtt = require('mqtt');
const { registerStudent, getStudents } = require('../../studentStore');
const { logRequest, logResponse } = require('../../logger');

function start(ports = {}, options = {}) {
  const MQTT_URL = options.url
      || (process.env.MQTT_URL
      ? `${process.env.MQTT_URL}:${process.env.MQTT_PORT}`
      : 'mqtt://test.mosquitto.org:1883');
  const TOPIC = options.topic || 'students';
  const client = mqtt.connect(MQTT_URL);

  client.on('connect', () => {
    client.subscribe(TOPIC, (error) => {
      if (error) {
        console.error('MQTT subscribe error', error);
        return;
      }
      console.log(`MQTT client connected to ${MQTT_URL} and subscribed to ${TOPIC}`);
    });
  });

  client.on('message', (topic, payload) => {
    if (topic !== TOPIC) return;

    let message = null;
    try {
      message = JSON.parse(payload.toString());
    } catch (error) {
      message = { raw: payload.toString() };
    }

    logRequest('MQTT message', { topic, message });

    if (!message || !message.action) {
      const response = { type: 'error', message: 'MQTT message requires an action.' };
      logResponse('MQTT message', response);
      client.publish(`${TOPIC}/response`, JSON.stringify(response));
      return;
    }

    if (message.action === 'register') {
      const student = registerStudent({
        protocol: 'MQTT',
        connectionId: `mqtt-${Date.now()}`,
        id: message.id,
        name: message.name,
        email: message.email
      });

      const response = { type: 'studentRegistered', student, students: getStudents('MQTT') };
      logResponse('MQTT register', response);
      client.publish(`${TOPIC}/response`, JSON.stringify(response));
      return;
    }

    if (message.action === 'getStudents') {
      const response = { type: 'students', students: getStudents('MQTT') };
      logResponse('MQTT getStudents', response);
      client.publish(`${TOPIC}/response`, JSON.stringify(response));
    }
  });

  client.on('error', (error) => {
    console.error('MQTT client error', error);
  });

  return client;
}

module.exports = { start };
