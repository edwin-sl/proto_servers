function logRequest(label, payload) {
  console.log(`[${new Date().toISOString()}] REQUEST ${label}: ${JSON.stringify(payload)}`);
}

function logResponse(label, payload) {
  console.log(`[${new Date().toISOString()}] RESPONSE ${label}: ${JSON.stringify(payload)}`);
}

module.exports = {
  logRequest,
  logResponse
};
