import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { AuthenticatedRequest } from '../auth/interface/authenticated-request.interface';

describe('ProfileController', () => {
  let controller: ProfileController;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
    }).compile();

    controller = app.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call req', async () => {
    const req = {user :{username:'test'}} as AuthenticatedRequest;
    expect(controller.getProfile(req).username).toBe('test');
  });
});
