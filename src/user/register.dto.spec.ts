import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should be defined', () => {
    expect(new RegisterDto()).toBeDefined();
  });

  it('should equals', () => {

    const dto: RegisterDto = {
      username: 'hantsy',
      password: 'password',
      firstName: 'Hantsy',
      lastName: 'Bai',
      email: 'hantsy@gmail.com'
    };

    expect(dto).toEqual(
      {
        username: 'hantsy',
        password: 'password',
        firstName: 'Hantsy',
        lastName: 'Bai',
        email: 'hantsy@gmail.com'
      }
    );

  });
});
