# NestJS Sample

![Compile and build](https://github.com/hantsy/nestjs-sample/actions/workflows/build.yml/badge.svg)
![Build Docker Image](https://github.com/hantsy/nestjs-sample/workflows/Dockerize/badge.svg)
![Run e2e testing](https://github.com/hantsy/nestjs-sample/workflows/e2e/badge.svg)
[![codecov](https://codecov.io/gh/hantsy/nestjs-rest-sample/branch/master/graph/badge.svg?token=MBLWAJPG13)](https://codecov.io/gh/hantsy/nestjs-rest-sample)

A sample NestJS project demonstrating RESTful APIs.

Features include:

- APIs that meet Richardson Maturity Model Level 2
- A custom Mongoose integration module (instead of `@nestjs/mongoose`)
- Passport/JWT authentication using simple text secrets
- Comprehensive tests built with Jest, `jest-mock-extended`, `ts-mockito`, `@golevelup/ts-jest`, etc.
- GitHub Actions workflows for continuous testing, coverage reporting, Docker image builds, and more

## Documentation

- [Getting Started](./docs/guide.md)
- [Connecting to MongoDB](./docs/mongo.md)
- [Securing APIs with JWT](./docs/auth.md)
- [Handling Model Relationships](./docs/model.md)
- [Externalizing Configuration](./docs/config.md)
- [User Registration](./docs/user.md)
- [Testing NestJS Applications](./docs/testing.md)

## Build & Run

Make sure you have Node.js and npm installed, then run the following commands in the project directory to install dependencies:

```bash
npm install
```

Start the application:

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

Run tests:

```bash
# unit tests
npm run test

# end-to-end tests
npm run test:e2e

# coverage report
npm run test:cov
```

## References

- [Official NestJS documentation](https://docs.nestjs.com/first-steps)
- [Unit testing NestJS applications with Jest](https://blog.logrocket.com/unit-testing-nestjs-applications-with-jest/)
- [ts-mockito – a TypeScript mocking library](https://github.com/NagRock/ts-mockito)
- [Clock‑in/out System Series](https://carloscaballero.io/part-2-clock-in-out-system-basic-backend/)
- [Modern full‑stack NestJS/React/TypeScript/MongoDB – Part 1](https://auth0.com/blog/modern-full-stack-development-with-nestjs-react-typescript-and-mongodb-part-1/) & [Part 2](https://auth0.com/blog/modern-full-stack-development-with-nestjs-react-typescript-and-mongodb-part-2/)
- [Jest full & partial mocks/spies of module imports](https://codewithhugo.com/jest-mock-spy-module-import/)

Helpful courses from [wanago.io](https://wanago.io/):

- [API with NestJS](https://wanago.io/courses/api-with-nestjs/)
- [TypeScript Express tutorial series](https://wanago.io/courses/typescript-express-tutorial/)
- [Node.js & TypeScript series](https://wanago.io/courses/node-js-typescript/)
- [JavaScript testing tutorial series](https://wanago.io/courses/javascript-testing-tutorial/)
