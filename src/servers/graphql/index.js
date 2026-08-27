 const { ApolloServer, gql } = require('apollo-server-express');
const { registerStudent, getStudents } = require('../../studentStore');
const { logRequest, logResponse } = require('../../logger');

const typeDefs = gql`
  type Student {
    id: String!
    name: String!
    email: String
    connectionId: String
    connectedAt: String!
  }

  type Query {
    hello: String!
    status: String!
    students: [Student!]!
  }

  type Mutation {
    sendMessage(message: String!): String!
    registerStudent(id: String!, name: String, email: String, connectionId: String): Student!
  }
`;

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
    registerStudent: (_, { protocol, id, name, email, connectionId }) => {
      const student = registerStudent({
        protocol: 'GraphQL',
        id,
        name,
        email,
        connectionId: connectionId || `graphql-${Date.now()}`
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
