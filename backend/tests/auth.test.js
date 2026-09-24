const request = require('supertest');
const app = require('../server');

describe('Auth', () => {
  it('rejects an invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('logs in successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
