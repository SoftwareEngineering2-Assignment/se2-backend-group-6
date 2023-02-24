const test = require('ava');
const request = require('supertest');
const app = require('../app');

test('GET /statistics returns correct statistics', async t => {
  const res = await request(app)
    .get('/statistics')
    .expect(200);

  t.is(res.body.success, true);
  t.true(typeof res.body.users === 'number');
  t.true(typeof res.body.dashboards === 'number');
  t.true(typeof res.body.views === 'number');
  t.true(typeof res.body.sources === 'number');
});

test('GET /test-url returns correct status for valid URL', async t => {
  const res = await request(app)
    .get('/test-url?url=https://www.google.com')
    .expect(200);

  t.is(res.body.status, 200);
  t.is(res.body.active, true);
});

test('GET /test-url returns correct status for invalid URL', async t => {
  const res = await request(app)
    .get('/test-url?url=https://www.nonexistent-website.com')
    .expect(200);

  t.is(res.body.status, 500);
  t.is(res.body.active, false);
});

test('GET /test-url-request returns correct response for GET request', async t => {
  const res = await request(app)
    .get('/test-url-request?url=https://jsonplaceholder.typicode.com/todos/1&type=GET')
    .expect(200);

  t.is(res.body.status, 200);
  t.deepEqual(res.body.response, {
    userId: 1,
    id: 1,
    title: 'delectus aut autem',
    completed: false
  });
});

test('GET /test-url-request returns correct response for POST request', async t => {
  const requestBody = {
    title: 'foo',
    body: 'bar',
    userId: 1
  };

  const res = await request(app)
    .get('/test-url-request?url=https://jsonplaceholder.typicode.com/posts&type=POST&body=' + encodeURIComponent(JSON.stringify(requestBody)))
    .expect(200);

  t.is(res.body.status, 201);
  t.deepEqual(res.body.response, {
    id: 101,
    ...requestBody
  });
});

test('GET /test-url-request returns correct response for PUT request', async t => {
  const requestBody = {
    title: 'foo',
    body: 'bar',
    userId: 1
  };

  const res = await request(app)
    .get('/test-url-request?url=https://jsonplaceholder.typicode.com/posts/1&type=PUT&body=' + encodeURIComponent(JSON.stringify(requestBody)))
    .expect(200);

  t.is(res.body.status, 200);
  t.deepEqual(res.body.response, {
    id: 1,
    ...requestBody
  });
});
