# NestJS Sample

![Compile and build](https://github.com/hantsy/nestjs-sample/workflows/Build/badge.svg)
![Build Docker Image](https://github.com/hantsy/nestjs-sample/workflows/Dockerize/badge.svg)
![Run e2e testing](https://github.com/hantsy/nestjs-sample/workflows/e2e/badge.svg)
[![codecov](https://codecov.io/gh/hantsy/nestjs-sample/branch/master/graph/badge.svg)](https://codecov.io/gh/hantsy/nestjs-sample)

A NestJS RESTful APIs sample project.

## Docs

* [Getting Started](./docs/guide.md)
* [Connecting to MongoDB](./docs/mongo.md)
* [Protect your APIs with JWT Token](./docs/auth.md)
* [Dealing with model relations](./docs/model.md)

## Build

Install the dependencies.

```bash
$ npm install
```

Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```



## Reference

* [The official Nestjs documentation](https://docs.nestjs.com/first-steps)

* [Unit testing NestJS applications with Jest](https://blog.logrocket.com/unit-testing-nestjs-applications-with-jest/)

* [ts-mockito: Mocking library for TypeScript inspired by http://mockito.org/](https://github.com/NagRock/ts-mockito)

* [Clock-in/out System Series](https://carloscaballero.io/part-2-clock-in-out-system-basic-backend/)

* [Modern Full-Stack Development with Nest.js, React, TypeScript, and MongoDB: Part 1](https://auth0.com/blog/modern-full-stack-development-with-nestjs-react-typescript-and-mongodb-part-1/), [Part 2](https://auth0.com/blog/modern-full-stack-development-with-nestjs-react-typescript-and-mongodb-part-2/)

* [Code with Hugo - Jest Full and Partial Mock/Spy of CommonJS and ES6 Module Imports](https://codewithhugo.com/jest-mock-spy-module-import/)
