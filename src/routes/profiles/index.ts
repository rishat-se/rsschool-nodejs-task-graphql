import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return await fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });
      if (!profile) throw fastify.httpErrors.notFound('profile not found');
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      //check if member type exists
      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: request.body.memberTypeId,
      });
      if (!memberType)
        throw fastify.httpErrors.badRequest('member type is incorrect');
      // check if user exists
      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: request.body.userId,
      });
      if (!user) throw fastify.httpErrors.badRequest('user id is incorrect');
      // check if profile already exists
      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: request.body.userId,
      });
      if (profile)
        throw fastify.httpErrors.badRequest('profile already exists');
      const newProfile = await fastify.db.profiles.create(request.body);
      return newProfile;
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      try {
        return await fastify.db.profiles.delete(request.params.id);
      } catch {
        throw fastify.httpErrors.badRequest('profile not found or wrong id');
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      //check if memberTypeId is present and is correct
      if (request.body.memberTypeId !== undefined) {
        const memberType = await fastify.db.memberTypes.findOne({
          key: 'id',
          equals: request.body.memberTypeId,
        });
        if (!memberType)
          throw fastify.httpErrors.badRequest('member type is incorrect');
      }
      try {
        return await fastify.db.profiles.change(
          request.params.id,
          request.body
        );
      } catch {
        throw fastify.httpErrors.badRequest('profile not found or wrong id');
      }
    }
  );
};

export default plugin;
