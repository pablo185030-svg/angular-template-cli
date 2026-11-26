import roles from '../../../../public/mock/roles.json';
import users from '../../../../public/mock/users.json';

describe('mock seed data', () => {
  it('has the default roles with their permissions', () => {
    expect(roles.map((role) => [role.name, role.permissions])).toEqual([
      ['admin', ['read', 'write', 'manage-roles']],
      ['escritura', ['read', 'write']],
      ['lectura', ['read']],
    ]);
  });

  it('has an admin user able to start a fresh project', () => {
    expect(users.find((user) => user.username === 'admin')).toMatchObject({
      password: '1234',
      email: 'admin@coto.com.ar',
      employeeNumber: '1234',
      roleId: 1,
    });
  });

  it('assigns every user to an existing role', () => {
    const ids = roles.map((role) => role.id);
    expect(users.every((user) => ids.includes(user.roleId))).toBe(true);
  });
});
