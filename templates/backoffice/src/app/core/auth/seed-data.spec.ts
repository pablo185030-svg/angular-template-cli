import users from '../../../../public/mock/users.json';

describe('mock seed data', () => {
  it('seeds only an admin user able to start a fresh project', () => {
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      username: 'admin',
      password: '1234',
      email: 'admin@coto.com.ar',
      employeeNumber: '1234',
    });
  });
});
