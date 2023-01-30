import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import {
  graphql,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
} from 'graphql';
import { graphqlBodySchema } from './schema';
import * as DataLoader from 'dataloader';

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
      //dataloaders
      const userLoader = new DataLoader(async (keys) => {
        const users = await fastify.db.users.findMany({
          key: 'id',
          equalsAnyOf: keys as string[],
        });
        return keys.map((key) => users.find((user) => user.id === key));
      });

      const membertypeLoader = new DataLoader(async (keys) => {
        const memberTypes = await fastify.db.memberTypes.findMany({
          key: 'id',
          equalsAnyOf: keys as string[],
        });
        return keys.map((key) =>
          memberTypes.find((memberType) => memberType.id === key)
        );
      });

      const profileLoader = new DataLoader(async (keys) => {
        const profiles = await fastify.db.profiles.findMany({
          key: 'userId',
          equalsAnyOf: keys as string[],
        });
        return keys.map((key) =>
          profiles.find((profile) => profile.userId === key)
        );
      });

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

      const UserType: any = new GraphQLObjectType({
        name: 'UserType',
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
              return await profileLoader.load(parent.id);
              // return await fastify.db.profiles.findOne({
              //   key: 'userId',
              //   equals: parent.id,
              // });
            },
          },
          memberType: {
            type: MemberTypeType,
            args: {},
            async resolve(parent) {
              //read profile to get memberTypeId
              const profile = await profileLoader.load(parent.id);
              // const profile = await fastify.db.profiles.findOne({
              //   key: 'userId',
              //   equals: parent.id,
              // });
              if (!profile)
                throw fastify.httpErrors.notFound('profile not found');
              return await membertypeLoader.load(profile.memberTypeId);
              // return await fastify.db.memberTypes.findOne({
              //   key: 'id',
              //   equals: profile.memberTypeId,
              // });
            },
          },

          userSubscribedTo: {
            type: new GraphQLList(UserType),
            args: {},
            async resolve(parent) {
              return await fastify.db.users.findMany({
                key: 'subscribedToUserIds',
                inArray: parent.id,
              });
            },
          },

          subscribedToUser: {
            type: new GraphQLList(UserType),
            args: {},
            async resolve(parent) {
              return await userLoader.loadMany(parent.subscribedToUserIds);
              // return await fastify.db.users.findMany({
              //   key: 'id',
              //   equalsAnyOf: parent.subscribedToUserIds,
              // });
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

      const UserUpdateType = new GraphQLInputObjectType({
        name: 'UserUpdateType',
        fields: {
          firstName: { type: GraphQLString },
          lastName: { type: GraphQLString },
          email: { type: GraphQLString },
        },
      });

      const ProfileUpdateType = new GraphQLInputObjectType({
        name: 'ProfileUpdateType',
        fields: {
          avatar: { type: GraphQLString },
          sex: { type: GraphQLString },
          birthday: { type: GraphQLString },
          country: { type: GraphQLString },
          street: { type: GraphQLString },
          city: { type: GraphQLString },
          memberTypeId: { type: GraphQLString },
        },
      });

      const PostUpdateType = new GraphQLInputObjectType({
        name: 'PostUpdateType',
        fields: {
          title: { type: GraphQLString },
          content: { type: GraphQLString },
        },
      });

      const MemberTypeUpdateType = new GraphQLInputObjectType({
        name: 'MemberTypeUpdateType',
        fields: {
          discount: { type: GraphQLInt },
          monthPostsLimit: { type: GraphQLInt },
        },
      });

      const SubscribeToType = new GraphQLInputObjectType({
        name: 'SubscribeToType',
        fields: {
          id: { type: GraphQLString },
        },
      });

      const UnsubscribeFromType = new GraphQLInputObjectType({
        name: 'UnsubscribeFromType',
        fields: {
          id: { type: GraphQLString },
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

          updateUser: {
            type: UserType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(UserUpdateType) },
            },
            async resolve(parent, args, options) {
              try {
                return await fastify.db.users.change(args.id, args.data);
              } catch {
                throw fastify.httpErrors.badRequest(
                  'user not found or wrong id'
                );
              }
            },
          },

          subscribeTo: {
            type: UserType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(SubscribeToType) },
            },
            async resolve(parent, args, options) {
              // check if user exists
              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: args.id,
              });
              if (!user) throw fastify.httpErrors.notFound('user not found');
              // check if subscriber already exists
              const idx = user.subscribedToUserIds.findIndex(
                (item) => item === args.data.id
              );
              if (idx !== -1)
                throw fastify.httpErrors.badRequest(
                  'user is already subscribed'
                );
              // add subscriber
              user.subscribedToUserIds.push(args.data.id);
              const changedUser = await fastify.db.users.change(args.id, {
                subscribedToUserIds: user.subscribedToUserIds,
              });
              return changedUser;
            },
          },

          unsubscribeFrom: {
            type: UserType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(UnsubscribeFromType) },
            },
            async resolve(parent, args, options) {
              //check if user exist
              const user = await fastify.db.users.findOne({
                key: 'id',
                equals: args.id,
              });
              if (!user) throw fastify.httpErrors.notFound('user not found');

              //check if subscriber exists
              const idx = user.subscribedToUserIds.findIndex(
                (item) => item === args.data.id
              );
              if (idx === -1)
                throw fastify.httpErrors.badRequest('user is not subscribed');

              user.subscribedToUserIds.splice(idx, 1);
              const changedUser = await fastify.db.users.change(args.id, {
                subscribedToUserIds: user.subscribedToUserIds,
              });
              return changedUser;
            },
          },

          updateProfile: {
            type: ProfileType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(ProfileUpdateType) },
            },
            async resolve(parent, args, options) {
              //check if memberTypeId is present and is correct
              if (args.data.memberTypeId !== undefined) {
                const memberType = await fastify.db.memberTypes.findOne({
                  key: 'id',
                  equals: args.data.memberTypeId,
                });
                if (!memberType)
                  throw fastify.httpErrors.badRequest(
                    'member type is incorrect'
                  );
              }
              try {
                return await fastify.db.profiles.change(args.id, args.data);
              } catch {
                throw fastify.httpErrors.badRequest(
                  'profile not found or wrong id'
                );
              }
            },
          },

          updatePost: {
            type: PostType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(PostUpdateType) },
            },
            async resolve(parent, args, options) {
              try {
                return await fastify.db.posts.change(args.id, args.data);
              } catch {
                throw fastify.httpErrors.badRequest(
                  'post not found or wrong id'
                );
              }
            },
          },

          updateMemberType: {
            type: MemberTypeType,
            args: {
              id: { type: GraphQLString },
              data: { type: new GraphQLNonNull(MemberTypeUpdateType) },
            },
            async resolve(parent, args, options) {
              try {
                return await fastify.db.memberTypes.change(args.id, args.data);
              } catch {
                throw fastify.httpErrors.badRequest('member type not found');
              }
            },
          },
        },
      });

      const Schema = new GraphQLSchema({
        query: QueryRootType,
        mutation: RootMutation,
      });

      if (request.body.query) {
        return await graphql({
          schema: Schema,
          source: request.body.query,
          variableValues: request.body.variables,
        });
      }
    }
  );
};

export default plugin;
