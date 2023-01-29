import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
//import { graphql, buildSchema } from 'graphql';
import { graphql, GraphQLObjectType, GraphQLString } from 'graphql';
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
} from 'graphql/type';
import { graphqlBodySchema } from './schema';
//import { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      // const schema = buildSchema(`
      //   type MemberTypeEntity {
      //     id: String!
      //     discount: Int!
      //     monthPostsLimit: Int!
      //   }

      //   type PostEntity {
      //     id: String!
      //     title: String!
      //     content: String!
      //     userId: String!
      //   }

      //   type ProfileEntity {
      //     id: String!
      //     avatar: String!
      //     sex: String!
      //     birthday: Int!
      //     country: String!
      //     street: String!
      //     city: String!
      //     memberTypeId: String!
      //     userId: String!
      //   }

      //   type UserEntity {
      //     id: String!
      //     firstName: String!
      //     lastName: String!
      //     email: String!
      //     subscribedToUserIds: [String]!
      //   }

      const MemberTypeType = new GraphQLObjectType({
        name: 'MemberType',
        fields: () => ({
          id: { type: GraphQLString },
          discount: { type: GraphQLInt },
          monthPostsLimit: { type: GraphQLInt },
        }),
      });

      const PostType = new GraphQLObjectType({
        name: 'PostType',
        fields: () => ({
          id: { type: GraphQLString },
          title: { type: GraphQLString },
          content: { type: GraphQLString },
          userId: { type: GraphQLString },
        }),
      });

      const ProfileType = new GraphQLObjectType({
        name: 'ProfileType',
        fields: () => ({
          id: { type: GraphQLString },
          avatar: { type: GraphQLString },
          sex: { type: GraphQLString },
          birthday: { type: GraphQLString },
          country: { type: GraphQLString },
          street: { type: GraphQLString },
          city: { type: GraphQLString },
          memberTypeId: { type: GraphQLString },
          userId: { type: GraphQLString },
        }),
      });

      const UserType = new GraphQLObjectType({
        name: 'User',
        fields: () => ({
          id: { type: GraphQLString },
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString },
          subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
          posts: {
            type: new GraphQLList(PostType),
            args: {},
            async resolve(parent) {
              return await fastify.db.posts.findMany({
                key: 'userId',
                equals: parent.id,
              });
            },
          },
          profile: {
            type: ProfileType,
            args: {},
            async resolve(parent) {
              return await fastify.db.posts.findOne({
                key: 'userId',
                equals: parent.id,
              });
            },
          },
          memberType: {
            type: MemberTypeType,
            args: {},
            async resolve(parent) {
              //read profile to get memberTypeId
              const profile = await fastify.db.profiles.findOne({
                key: 'userId',
                equals: parent.id,
              });
              if (!profile)
                throw fastify.httpErrors.notFound('profile not found');
              return await fastify.db.memberTypes.findOne({
                key: 'id',
                equals: profile.memberTypeId,
              });
            },
          },
        }),
      });

      const UserInputType = new GraphQLInputObjectType({
        name: 'UserInputType',
        fields: {
          firstName: { type: new GraphQLNonNull(GraphQLString) },
          lastName: { type: new GraphQLNonNull(GraphQLString) },
          email: { type: new GraphQLNonNull(GraphQLString) },
        },
      });

      const PostInputType = new GraphQLInputObjectType({
        name: 'PostInputType',
        fields: {
          title: { type: new GraphQLNonNull(GraphQLString) },
          content: { type: new GraphQLNonNull(GraphQLString) },
          userId: { type: new GraphQLNonNull(GraphQLString) },
        },
      });

      const ProfileInputType = new GraphQLInputObjectType({
        name: 'ProfileInputType',
        fields: {
          avatar: { type: new GraphQLNonNull(GraphQLString) },
          sex: { type: new GraphQLNonNull(GraphQLString) },
          birthday: { type: new GraphQLNonNull(GraphQLInt) },
          country: { type: new GraphQLNonNull(GraphQLString) },
          street: { type: new GraphQLNonNull(GraphQLString) },
          city: { type: new GraphQLNonNull(GraphQLString) },
          memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
          userId: { type: new GraphQLNonNull(GraphQLString) },
        },
      });

      const QueryRootType = new GraphQLObjectType({
        name: 'QueryRootType',
        fields: {
          memberTypes: {
            type: new GraphQLList(MemberTypeType),
            args: {},
            async resolve() {
              return await fastify.db.memberTypes.findMany();
            },
          },

          posts: {
            type: new GraphQLList(PostType),
            args: {},
            async resolve() {
              return await fastify.db.posts.findMany();
            },
          },

          profiles: {
            type: new GraphQLList(ProfileType),
            args: {},
            async resolve() {
              return await fastify.db.profiles.findMany();
            },
          },

          users: {
            type: new GraphQLList(UserType),
            args: {},
            async resolve() {
              return await fastify.db.users.findMany();
            },
          },

          memberType: {
            type: MemberTypeType,
            args: { id: { type: GraphQLString } },
            async resolve(parent, args) {
              return await fastify.db.memberTypes.findOne({
                key: 'id',
                equals: args.id,
              });
            },
          },

          post: {
            type: PostType,
            args: { id: { type: GraphQLString } },
            async resolve(parent, args) {
              return await fastify.db.posts.findOne({
                key: 'id',
                equals: args.id,
              });
            },
          },

          profile: {
            type: ProfileType,
            args: { id: { type: GraphQLString } },
            async resolve(parent, args) {
              return await fastify.db.profiles.findOne({
                key: 'id',
                equals: args.id,
              });
            },
          },

          user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            async resolve(parent, args) {
              return await fastify.db.users.findOne({
                key: 'id',
                equals: args.id,
              });
            },
          },
        },
      });

      const RootMutation = new GraphQLObjectType({
        name: 'RootMutationType',
        fields: {
          addUser: {
            type: UserType,
            args: {
              data: { type: new GraphQLNonNull(UserInputType) },
            },
            async resolve(parent, args, options) {
              const user = await fastify.db.users.create(args.data);
              return user;
            },
          },
          addPost: {
            type: PostType,
            args: {
              data: { type: new GraphQLNonNull(PostInputType) },
            },
            async resolve(parent, args, options) {
              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: args.data.userId,
              });
              if (!user)
                throw fastify.httpErrors.badRequest('user doesnt exist');
              return await fastify.db.posts.create(args.data);
            },
          },
          addProfile: {
            type: ProfileType,
            args: {
              data: { type: new GraphQLNonNull(ProfileInputType) },
            },
            async resolve(parent, args, options) {
              //check if member type exists
              const memberType = await fastify.db.memberTypes.findOne({
                key: 'id',
                equals: args.data.memberTypeId,
              });
              if (!memberType)
                throw fastify.httpErrors.badRequest('member type is incorrect');
              // check if user exists
              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: args.data.userId,
              });
              if (!user)
                throw fastify.httpErrors.badRequest('user id is incorrect');
              // check if profile already exists
              const profile = await fastify.db.profiles.findOne({
                key: 'userId',
                equals: args.data.userId,
              });
              if (profile)
                throw fastify.httpErrors.badRequest('profile already exists');
              const newProfile = await fastify.db.profiles.create(args.data);
              return newProfile;
            },
          },
        },
      });

      const Schema = new GraphQLSchema({
        query: QueryRootType,
        mutation: RootMutation,
      });

      //   type Query {
      //     getUsers: [UserEntity]
      //     getProfiles: [ProfileEntity]
      //     getPosts: [PostEntity]
      //     getMemberTypes: [MemberTypeEntity]
      //     getUser(id: String): UserEntity
      //   }
      // `);

      // var root = {
      //   getMemberTypes: async () => {
      //     return await fastify.db.memberTypes.findMany();
      //   },
      //   getPosts: async () => {
      //     return await fastify.db.posts.findMany();
      //   },
      //   getProfiles: async () => {
      //     return await fastify.db.profiles.findMany();
      //   },
      //   getUsers: async () => {
      //     return await fastify.db.users.findMany();
      //   },
      //   getUser: async ({ id }: { id: string }) => {
      //     console.log(id);
      //     return await fastify.db.users.findOne({ key: 'id', equals: id });
      //   },
      // };

      if (request.body.query) {
        return await graphql({
          schema: Schema,
          source: request.body.query,
          variableValues: request.body.variables,
          //          rootValue: root,
        });
      }
    }
  );
};

export default plugin;
