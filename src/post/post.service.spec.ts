import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { toArray, take, throttleTime } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAllPosts should return 3 posts', done => {
    service
      .findAll()
      .pipe(take(3), toArray())
      .subscribe({
        next: data => expect(data.length).toBe(3),
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('getAllPosts with keyword should return 1 post', done => {
    service
      .findAll('Generate')
      .pipe(take(3), toArray())
      .subscribe({
        next: data => expect(data.length).toBe(1),
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('getPostById with existing id should return 1 post', done => {
    service
      .findById(1)
      .pipe(take(3), toArray())
      .subscribe({
        next: data => expect(data.length).toBe(1),
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('getPostById with none existing id should return empty', done => {
    service
      .findById(10001)
      .pipe(take(3), toArray())
      .subscribe({
        next: data => expect(data.length).toBe(0),
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('save should increase the length of posts', done => {
    service
      .save({
        id: 4,
        title: 'test title',
        content: 'test content',
      })
      .pipe(take(4), toArray())
      .subscribe({
        next: data => {
          expect(data.length).toBe(4);
          expect(data[3].createdAt).toBeTruthy();
        },
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('update should change the content of post', done => {
    service
      .update(1, {
        id: 1,
        title: 'test title',
        content: 'test content',
        createdAt: new Date(),
      })
      .pipe(take(4), toArray())
      .subscribe({
        next: data => {
          expect(data.length).toBe(3);
          expect(data[0].title).toBe('test title');
          expect(data[0].content).toBe('test content');
          expect(data[0].updatedAt).not.toBeNull();
        },
        error: error => console.log(error),
        complete: done(),
      });
  });

  it('deleteById with existing id should return true', done => {
    service.deleteById(1).subscribe({
      next: data => expect(data).toBeTruthy,
      error: error => console.log(error),
      complete: done(),
    });
  });

  it('deleteById with existing id should return true', done => {
    service.deleteById(10001).subscribe({
      next: data => expect(data).toBeFalsy,
      error: error => console.log(error),
      complete: done(),
    });
  });
});

// see: https://stackoverflow.com/questions/62208107/how-test-a-rxjs-empty-operater-using-jest
// https://rxjs-dev.firebaseapp.com/guide/testing/marble-testing
describe('PostService(test for empty())', () => {
  let service: PostService;
  let testScheduler: TestScheduler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostService],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      // asserting the two objects are equal
      // e.g. using chai.
      expect(actual).toEqual(expected);
    });
  });

  // This test will actually run *synchronously*
  it('test complete for empty()', () => {
    testScheduler.run(helpers => {
      const { cold, expectObservable, expectSubscriptions } = helpers;
      // const e1 = cold('-a--b--c---|');
      // const subs = '^----------!';
      // const expected = '-a-----c---|';

      // expectObservable(e1.pipe(throttleTime(3, testScheduler))).toBe(expected);
      // expectSubscriptions(e1.subscriptions).toBe(subs);
      expectObservable(service.findById(10001)).toBe('|');
    });
  });

  it('getPostById with none existing id should return empty', done => {
    service.findById(10001).subscribe({
      next: data => {
        console.log('complete:' + typeof data);
        expect(data).toBeNaN();
      },
      error: error => console.log(error),
      complete: done,
    });
  });
});
