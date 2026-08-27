 const fs = require('fs');
 const path = require('path');
 const { ApolloServer, gql } = require('apollo-server-express');
 const { registerStudent, getStudents } = require('../../studentStore');
 const { logRequest, logResponse } = require('../../logger');

 const schemaPath = path.join(__dirname, 'schema.graphql');
 const typeDefs = gql`${fs.readFileSync(schemaPath, 'utf8')}`;

const resolvers = {
  Query: {
    hello: () => 'Hello from GraphQL!',
    status: () => 'GraphQL server is running',
    students: (_) => {
      const list = getStudents();
      logRequest('GraphQL students query', {});
      logResponse('GraphQL students query', { count: list.length, students: list });
      return list;
    }
  },
  Mutation: {
    sendMessage: (_, { message }) => {
      logRequest('GraphQL sendMessage', { message });
      const response = `GraphQL received: ${message}`;
      logResponse('GraphQL sendMessage', { response });
      return response;
    },
    registerStudent: (_, { protocol, id, name, email }) => {
      const student = registerStudent({
        protocol: 'GraphQL',
        id,
        name,
        email,
        connectionId: `graphql-${Date.now()}`
      });
      logRequest('GraphQL registerStudent', { protocol, studentId: id, name, email });
      logResponse('GraphQL registerStudent', student);
      return student;
    }
  }
};

async function apply(app) {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
  return server;
}

module.exports = { apply };
