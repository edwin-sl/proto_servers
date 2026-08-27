const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { registerStudent, getStudents, getStudentByStudentId } = require('../../studentStore');
const { logRequest, logResponse } = require('../../logger');

function start(ports = {}) {
  const GRPC_PORT = Number(ports.GRPC_PORT || process.env.GRPC_PORT || 50051);
  const protoPath = path.join(__dirname, '..', '..', 'protos', 'student_crud.proto');
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  });

  const studentCrudProto = grpc.loadPackageDefinition(packageDefinition).studentcrud;
  const grpcServer = new grpc.Server();

  grpcServer.addService(studentCrudProto.StudentCRUD.service, {
    RegisterStudent: (call, callback) => {
      const payload = {
        protocol: 'gRPC',
        id: call.request.id,
        name: call.request.name,
        email: call.request.email,
        connectionId: `grpc-${Date.now()}`
      };

      logRequest('gRPC RegisterStudent', payload);
      const student = registerStudent(payload);
      const response = {
        id: student.id,
        name: student.name,
        email: student.email,
        connectionId: student.connectionId,
        connectedAt: student.connectedAt
      };
      logResponse('gRPC RegisterStudent', response);
      callback(null, response);
    },
    GetStudents: (call, callback) => {
      const targetId = call.request.id || null;
      logRequest('gRPC GetStudents', { id: targetId });
      const students = getStudents()
        .filter((student) => !targetId || student.id === targetId)
        .map((student) => ({
          id: student.id,
          name: student.name,
          email: student.email,
          connectionId: student.connectionId,
          connectedAt: student.connectedAt
        }));
      const response = { students };
      logResponse('gRPC GetStudents', response);
      callback(null, response);
    },
    GetStudent: (call, callback) => {
      const id = call.request.id || null;
      logRequest('gRPC GetStudent', { id });
      if (!id) {
        return callback(null, {});
      }
      const student = getStudentByStudentId(id);
      if (!student) {
        return callback(null, {});
      }
      const response = {
        id: student.id,
        name: student.name,
        email: student.email,
        connectionId: student.connectionId,
        connectedAt: student.connectedAt
      };
      logResponse('gRPC GetStudent', response);
      callback(null, response);
    }
  });

  grpcServer.bindAsync(`0.0.0.0:${GRPC_PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    grpcServer.start();
    console.log(`gRPC server listening on localhost:${GRPC_PORT}`);
  });

  return grpcServer;
}

module.exports = { start };
