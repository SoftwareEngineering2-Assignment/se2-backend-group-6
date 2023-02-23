const test = require('ava');
const request = require('supertest');
const app = require('../src/index.js');
const Dashboard = require('../src/models/dashboard');
// Set up a mock user and token for testing
const { jwtSign } = require('../src/utilities/authentication/helpers');
require('dotenv').config();

// Assuming a user object with id and email properties
const user = {
  id: 123,
  email: 'user@example.com'
};

// Set the JWT secret and options (expiration time, etc.)
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '1h';

// Create the JWT token using your custom jwtSign function
const token = jwtSign({ user }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });


test.before(async (t) => {
  t.context.server = http.createServer(app);
  t.context.prefixUrl = await listen(t.context.server);
  t.context.got = got.extend({http2: true, throwHttpErrors: false, responseType: 'json', prefixUrl: t.context.prefixUrl});
});


// const token = jwtSign(user);

// Define the test data
const dashboardData = {
  name: 'Test Dashboard',
  layout: [],
  items: [],
  nextId: 1,
  password: '',
  shared: false,
  views: 0,
  owner: user.id,
  createdAt: new Date()
};

// Test the /dashboards route
test('GET /dashboards returns list of user dashboards', async (t) => {
  // Create a mock dashboard in the database
  const dashboard = await Dashboard.create(dashboardData);

  // Make the request to the route with the mock token
  const res = await request(app)
    .get('/dashboards')
    .set('Authorization', `Bearer ${token}`);

  // Assert that the response contains the dashboard we created
  t.is(res.status, 200);
  t.deepEqual(res.body, [{ id: dashboard.id, name: dashboardData.name }]);
});

// Test the /create-dashboard route
test('POST /create-dashboard creates new dashboard for user', async (t) => {
  // Make the request to the route with the mock token and dashboard data
  const res = await request(app)
    .post('/create-dashboard')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: dashboardData.name });

  // Assert that the response indicates success and the dashboard was created
  t.is(res.status, 200);
  const dashboard = await Dashboard.findOne({ name: dashboardData.name });
  t.truthy(dashboard);
});

// Test the /delete-dashboard route
test('POST /delete-dashboard deletes user dashboard', async (t) => {
  // Create a mock dashboard in the database
  const dashboard = await Dashboard.create(dashboardData);

  // Make the request to the route with the mock token and dashboard ID
  const res = await request(app)
    .post('/delete-dashboard')
    .set('Authorization', `Bearer ${token}`)
    .send({ id: dashboard.id });

  // Assert that the response indicates success and the dashboard was deleted
  t.is(res.status, 200);
  const deletedDashboard = await Dashboard.findById(dashboard.id);
  t.falsy(deletedDashboard);
});

// Test the /dashboard route
test('GET /dashboard returns user dashboard details and sources', async (t) => {
  // Create a mock dashboard and source in the database
  const dashboard = await Dashboard.create(dashboardData);
  const sourceData = { name: 'Test Source', owner: user.id };
  const source = await Source.create(sourceData);
  dashboard.items.push({ source: source.id });

  // Make the request to the route with the mock token and dashboard ID
  const res = await request(app)
    .get(`/dashboard?id=${dashboard.id}`)
    .set('Authorization', `Bearer ${token}`);

  // Assert that the response contains the dashboard and source data
  t.is(res.status, 200);
  t.deepEqual(res.body, {
    id: dashboard.id,
    name: dashboardData.name,
    sources: [sourceData.name]
  });
});

// Test the /save-dashboard route
test('POST /save-dashboard updates user dashboard details', async (t) => {
  // Create a mock user in the database
  const user = await User.create({
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123'
  });

  // Create a mock dashboard in the database
  const dashboard = await Dashboard.create({
    name: 'My Dashboard',
    layout: [],
    items: {},
    nextId: 1,
    password: null,
    shared: false,
    views: 0,
    owner: user._id,
    createdAt: new Date()
  });

  const token = jwtSign({ userId: user._id });

  // Update dashboard details
  const updatedDashboardData = {
    name: 'My Updated Dashboard',
    layout: ['item1', 'item2'],
    items: {
      item1: {
        type: 'chart',
        chartType: 'bar',
        data: [5, 10, 15]
      },
      item2: {
        type: 'table',
        data: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
          { name: 'Bob', age: 40 }
        ]
      }
    },
    shared: true
  };
  const res = await app.inject({
    method: 'POST',
    url: '/save-dashboard',
    headers: {
      Authorization: `Bearer ${token}`
    },
    payload: {
      dashboardId: dashboard._id,
      ...updatedDashboardData
    }
  });

  t.equal(res.statusCode, 200, 'Returns 200 status code');
  t.equal(res.json().name, updatedDashboardData.name, 'Updates dashboard name');
  t.same(res.json().layout, updatedDashboardData.layout, 'Updates dashboard layout');
  t.same(res.json().items, updatedDashboardData.items, 'Updates dashboard items');
  t.equal(res.json().shared, updatedDashboardData.shared, 'Updates dashboard shared flag');
});
test.after.always((t) => {
  t.context.server.close();
});