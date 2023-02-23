const test = require('ava');
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/index.js');
const Source = require('../src/models/source');

// Make sure to connect to the database before running any tests
test.before(async (t) => {
    t.context.server = http.createServer(app);
    t.context.prefixUrl = await listen(t.context.server);
    t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
  });
  
// Test the GET /sources route
test.serial('GET /sources returns sources owned by the authenticated user', async (t) => {
  const owner = mongoose.Types.ObjectId();
  const otherOwner = mongoose.Types.ObjectId();
  const source1 = await Source.create({ name: 'Source 1', type: 'type1', owner });
  const source2 = await Source.create({ name: 'Source 2', type: 'type2', owner });
  await Source.create({ name: 'Other user source', type: 'type3', owner: otherOwner });
  const token = 'some-auth-token'; // Set the authorization header with the token for authentication
  const response = await request(app)
    .get('/sources')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/);
  t.true(response.body.success);
  t.is(response.body.sources.length, 2);
  t.deepEqual(response.body.sources, [
    {
      id: source1._id.toString(),
      name: 'Source 1',
      type: 'type1',
      url: '',
      login: '',
      passcode: '',
      vhost: '',
      active: false,
    },
    {
      id: source2._id.toString(),
      name: 'Source 2',
      type: 'type2',
      url: '',
      login: '',
      passcode: '',
      vhost: '',
      active: false,
    },
  ]);
});

// Test the POST /create-source route
test.serial('POST /create-source creates a new source owned by the authenticated user', async (t) => {
  const owner = mongoose.Types.ObjectId();
  const token = 'some-auth-token'; // Set the authorization header with the token for authentication
  const response = await request(app)
    .post('/create-source')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'New source',
      type: 'type1',
      url: 'http://example.com',
      login: 'username',
      passcode: 'password',
      vhost: 'vhost',
    })
    .expect(200)
    .expect('Content-Type', /json/);
  t.true(response.body.success);
  const createdSource = await Source.findOne({ name: 'New source', owner });
  t.truthy(createdSource);
  t.is(createdSource.type, 'type1');
  t.is(createdSource.url, 'http://example.com');
  t.is(createdSource.login, 'username');
  t.is(createdSource.passcode, 'password');
  t.is(createdSource.vhost, 'vhost');
});

test('GET /', async t => {
    const res = await request(app).get('/')
    t.is(res.status, 200)
    t.is(res.text, 'Hello World!')
  })
  
  test('GET /users', async t => {
    const res = await request(app).get('/users')
    t.is(res.status, 200)
    t.deepEqual(res.body, [])
  })
  
  test('POST /users', async t => {
    const user = { name: 'John', age: 30 }
    const res = await request(app).post('/users').send(user)
    t.is(res.status, 201)
    t.deepEqual(res.body, user)
  })
  
  test('GET /users/:id', async t => {
    const user = { name: 'John', age: 30 }
    const createUserRes = await request(app).post('/users').send(user)
    const userId = createUserRes.body.id
    const res = await request(app).get(`/users/${userId}`)
    t.is(res.status, 200)
    t.deepEqual(res.body, user)
  })
  
  test('PUT /users/:id', async t => {
    const user = { name: 'John', age: 30 }
    const createUserRes = await request(app).post('/users').send(user)
    const userId = createUserRes.body.id
    const updatedUser = { name: 'Jane', age: 35 }
    const res = await request(app).put(`/users/${userId}`).send(updatedUser)
    t.is(res.status, 200)
    t.deepEqual(res.body, { id: userId, ...updatedUser })
  })
  
  test('DELETE /users/:id', async t => {
    const user = { name: 'John', age: 30 }
    const createUserRes = await request(app).post('/users').send(user)
    const userId = createUserRes.body.id
    const res = await request(app).delete(`/users/${userId}`)
    t.is(res.status, 204)
  })
  