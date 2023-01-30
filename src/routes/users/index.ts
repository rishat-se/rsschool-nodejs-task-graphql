import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import {
  createUserBodySchema,
  changeUserBodySchema,
  subscribeBodySchema,
} from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return await fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!user) throw fastify.httpErrors.notFound('profile not found');
      return user;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.create(request.body);
      return user;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      //add unsubscribe and delete posts logic
      try {
        //delete profile
        const profile = await fastify.db.profiles.findOne({
          key: 'userId',
          equals: request.params.id,
        });
        if (profile) {
          await fastify.db.profiles.delete(profile.id);
        }
        //delete posts
        const posts = await fastify.db.posts.findMany({
          key: 'userId',
          equals: request.params.id,
        });
        posts.forEach(async (post) => {
          await fastify.db.posts.delete(post.id);
        });
        //delete from subscrideToUserIds arrays
        const users = await fastify.db.users.findMany({
          key: 'subscribedToUserIds',
          inArray: request.params.id,
        });
        users.forEach(async (user) => {
          const idx = user.subscribedToUserIds.findIndex(
            (item) => item === request.params.id
          );
          user.subscribedToUserIds.splice(idx, 1);
          await fastify.db.users.change(user.id, {
            subscribedToUserIds: user.subscribedToUserIds,
          });
        });
        return await fastify.db.users.delete(request.params.id);
      } catch {
        throw fastify.httpErrors.badRequest('user not found or wrong id');
      }
    }
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      // check if user exists
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!user) throw fastify.httpErrors.notFound('user not found');
      // check if subscriber already exists
      const idx = user.subscribedToUserIds.findIndex((item) => {
        item === request.params.id;
      });
      if (idx !== -1)
        throw fastify.httpErrors.badRequest('user is already subscribed');
      // add subscriber
      user.subscribedToUserIds.push(request.params.id);
      const changedUser = await fastify.db.users.change(request.body.userId, {
        subscribedToUserIds: user.subscribedToUserIds,
      });
      return changedUser;
    }
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      //check if user exist
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!user) throw fastify.httpErrors.notFound('user not found');
      //check if subscriber exists
      const idx = user.subscribedToUserIds.findIndex(
        (item) => item === request.params.id
      );
      if (idx === -1)
        throw fastify.httpErrors.badRequest('user is not subscribed');
      //change shallow copy or original?
      //const newSubscribedToList = user.subscribedToUserIds.filter((item) => item !== request.body.userId);
      user.subscribedToUserIds.splice(idx, 1);
      const changedUser = await fastify.db.users.change(request.body.userId, {
        subscribedToUserIds: user.subscribedToUserIds,
      });
      return changedUser;
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      try {
        return await fastify.db.users.change(request.params.id, request.body);
      } catch {
        throw fastify.httpErrors.badRequest('user not found or wrong id');
      }
    }
  );
};

export default plugin;
