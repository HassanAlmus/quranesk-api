const { ApolloServer } = require('apollo-server');
const resolvers = require('./resolvers-mongodb');
const typeDefs = require('./typeDefs');

const server = new ApolloServer({ typeDefs, resolvers });

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
    console.log(`
      🚀  MongoDB Server is ready at ${url}
      📭  Query at https://studio.apollographql.com/dev
      🗄️  Using MongoDB for data storage
    `);
  });

//YA ABALFAZL
