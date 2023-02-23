import test from 'ava';
import request from 'supertest';
import app from '../src/index.js';

// Register user
test('User registration', async (t) => {
  const res = await request(app)
    .post('/user/create')
    .send({
      username: 'testuser',
      password: 'testpassword',
      email: 'testuser@test.com',
    });

  t.is(res.status, 200);
  t.true(res.body.success);
});

// Authenticate user
test('User authentication', async (t) => {
  const res = await request(app)
    .post('/user/authenticate')
    .send({
      username: 'testuser',
      password: 'testpassword',
    });

  t.is(res.status, 200);
  t.truthy(res.body.token);
});

// Request password reset
test('Request password reset', async (t) => {
  const res = await request(app)
    .post('/user/resetpassword')
    .send({
      username: 'testuser',
    });

  t.is(res.status, 200);
  t.true(res.body.ok);
});

// Change password
test('Change password', async (t) => {
  // Authenticate user to get token
  const authRes = await request(app)
    .post('/user/authenticate')
    .send({
      username: 'testuser',
      password: 'testpassword',
    });

  const token = authRes.body.token;

  const res = await request(app)
    .post('/user/changepassword')
    .set('Authorization', `Bearer ${token}`)
    .send({
      password: 'newtestpassword',
    });

  t.is(res.status, 200);
  t.true(res.body.ok);
});