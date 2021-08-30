import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('API endpoints testing (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableShutdownHooks();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/register a new user', () => {
    it('if username is existed', async () => {
      const res = await request(app.getHttpServer())
        .post('/register')
        .send({
          username: 'hantsy',
          password: 'password',
          email: 'hantsy@test.com',
          firstName: 'Hantsy',
          lastName: 'Bai'
        });
      expect(res.status).toBe(409);
    });

    it('if email is existed', async () => {
      const res = await request(app.getHttpServer())
        .post('/register')
        .send({
          username: 'hantsy1',
          password: 'password',
          email: 'hantsy@example.com',
          firstName: 'Hantsy',
          lastName: 'Bai'
        });
      expect(res.status).toBe(409);
    });

    it('successed', async () => {
      const res = await request(app.getHttpServer())
        .post('/register')
        .send({
          username: 'hantsy1',
          password: 'password',
          email: 'hantsy@gmail.com',
          firstName: 'Hantsy',
          lastName: 'Bai'
        });
      expect(res.status).toBe(201);
    });
  });

  describe('if user is not logged in', () => {
    it('/posts (GET)', async () => {
      const res = await request(app.getHttpServer()).get('/posts').send();
      expect(res.status).toBe(200);
      expect(res.body.length).toEqual(3);
    });

    it('/posts (GET) if none existing should return 404', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer()).get('/posts/' + id);
      expect(res.status).toBe(404);
    });

    it('/posts (GET) if invalid id should return 400', async () => {
      const id = "invalidid";
      const res = await request(app.getHttpServer()).get('/posts/' + id);
      expect(res.status).toBe(400);
    });

    it('/posts (POST) should return 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'test title', content: 'test content' });
      expect(res.status).toBe(401);
    });

    it('/posts (PUT) should return 401', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer())
        .put('/posts/' + id)
        .send({ title: 'test title', content: 'test content' });
      expect(res.status).toBe(401);
    });

    it('/posts (DELETE) should return 401', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer())
        .delete('/posts/' + id)
        .send();
      expect(res.status).toBe(401);
    });
  });

  describe('if user is logged in as (USER)', () => {
    let jwttoken: any;
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'hantsy', password: 'password' });

      expect(res.status).toBe(201);
      jwttoken = res.body.access_token;
      //console.log(JSON.stringify(res));
    });

    it('/posts (GET)', async () => {
      const res = await request(app.getHttpServer()).get('/posts');
      expect(res.status).toBe(200);
      expect(res.body.length).toEqual(3);
    });

    it('/posts (POST) with empty body should return 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Bearer ' + jwttoken)
        .send({});
      console.log(res.status);
      expect(res.status).toBe(400);
    });

    it('/posts (PUT) if none existing should return 404', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer())
        .put('/posts/' + id)
        .set('Authorization', 'Bearer ' + jwttoken)
        .send({ title: 'test title', content: 'test content' });
      expect(res.status).toBe(404);
    });

    it('/posts (DELETE) if none existing should return 403', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer())
        .delete('/posts/' + id)
        .set('Authorization', 'Bearer ' + jwttoken)
        .send();
      expect(res.status).toBe(403);
    });

    it('/posts crud flow', async () => {
      //create a post
      const res = await request(app.getHttpServer())
        .post('/posts')
        .set('Authorization', 'Bearer ' + jwttoken)
        .send({ title: 'test title', content: 'test content' });
      expect(res.status).toBe(201);
      const saveduri = res.get('Location');
      //console.log(saveduri);

      // get the saved post
      const resget = await request(app.getHttpServer()).get(saveduri);
      expect(resget.status).toBe(200);
      expect(resget.body.title).toBe('test title');
      expect(resget.body.content).toBe('test content');
      expect(resget.body.createdAt).toBeDefined();

      // update the post
      const updateres = await request(app.getHttpServer())
        .put(saveduri)
        .set('Authorization', 'Bearer ' + jwttoken)
        .send({ title: 'updated title', content: 'updated content' });
      expect(updateres.status).toBe(204);

      // verify the updated post
      const updatedres = await request(app.getHttpServer()).get(saveduri);
      expect(updatedres.status).toBe(200);
      expect(updatedres.body.title).toBe('updated title');
      expect(updatedres.body.content).toBe('updated content');
      expect(updatedres.body.updatedAt).toBeDefined();

      // creat a comment
      const commentres = await request(app.getHttpServer())
        .post(saveduri + '/comments')
        .set('Authorization', 'Bearer ' + jwttoken)
        .send({ content: 'test content' });
      expect(commentres.status).toBe(201);
      expect(commentres.get('Location')).toBeTruthy();

      // get the comments of post
      const getCommentsRes = await request(app.getHttpServer()).get(
        saveduri + '/comments',
      );
      expect(getCommentsRes.status).toBe(200);
      expect(getCommentsRes.body.length).toEqual(1);

      // delete the posts
      const deleteRes = await request(app.getHttpServer())
        .delete(saveduri)
        .set('Authorization', 'Bearer ' + jwttoken)
        .send();
      expect(deleteRes.status).toBe(403);
    });
  });

  describe('if user is logged in as (ADMIN)', () => {
    let jwttoken: any;
    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' });
      jwttoken = res.body.access_token;
      // console.log(jwttoken);
    });

    it('/posts (DELETE) if none existing should return 404', async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await request(app.getHttpServer())
        .delete('/posts/' + id)
        .set('Authorization', 'Bearer ' + jwttoken)
        .send();
      expect(res.status).toBe(404);
    });
  });
});
