# T&F User Management API Service

> An user management api service delivered for the Consumer Platform, from the T&F Engineering Team, using [Node.js](https://nodejs.org/en/) and [TypeScript](http://www.typescriptlang.org/).

> [Node.js](https://nodejs.org/en/) is used for dependency management and a foundation for development, as well as a proxy for building and serving the site using the "scripts" property of the `package.json` file. [TypeScript](http://www.typescriptlang.org/) is a superset language of JavaScript as well as a JS-compiler. [Typings](https://github.com/typings/typings) provides type definitions for TypeScript and [TsLint](http://palantir.github.io/tslint/) provides linting for TypeScript. [Learn more about TypeScript](https://github.com/TypeStrong/learn-typescript).

## Table of Contents

1. [Dependencies](#dependencies)
  1. [System Dependencies](#system-dependencies)
  2. [Node Dependencies](#node-dependencies)
2. [File Structure](#file-structure)
3. [Getting Started](#getting-started)
  1. [Install system dependencies](#install-system-dependencies)
  2. [Install the app](#install-the-app)
  3. [Run the app](#run-the-app)
  4. [Update the app](#update-the-app)
  5. [Uninstall the app](#uninstall-the-app)
4. [TypeScript](#typescript)
5. [Typings](#typings)
6. [API Strategy](#strategy)
7. [API Routes](#routes)
8. [Testing](#testing)

## Dependencies <a id="dependencies"></a>

### System Dependencies <a id="system-dependencies"></a>

- [Node.js](https://nodejs.org/en/)
- [NPM](https://www.npmjs.com/)
- [TypeScript](http://www.typescriptlang.org/)
- [Typings](https://github.com/typings/typings)

### Node Dependencies <a id="node-dependencies"></a>

#### Dependencies

- [core-js](https://github.com/zloirock/core-js): Modular standard library for JavaScript.
- [body-parser](): Node.JS body parsing middleware
- [lodash](https://lodash.com/): A modern JavaScript utility library delivering modularity, performance, & extras.
- [mocha](https://mochajs.org/): Mocha is a feature-rich JavaScript test framework running on Node.js and in the browser.
- [chai](https://chaijs.com/): Chai is a BDD / TDD assertion library for [node](http://nodejs.org) and the browser that can be delightfully paired with any javascript testing framework.
- [bcryptjs](https://www.npmjs.com/package/bcryptjs): Lib to help you hash passwords.
- [jwt-simple](https://www.npmjs.com/package/jwt-simple): JWT JSON Web Token encode and decode module.
- [log4js](https://github.com/stritti/log4js): The logging framework for JavaScript.
- [mongoose](http://mongoosejs.com/): Mongoose provides a straight-forward, schema-based solution to model your application data. It includes built-in type casting, validation, query building, business logic hooks and more, out of the box.
- [passport](https://passportjs.org/): Passport is authentication middleware for Node.js. Extremely flexible and modular.
- [nodemailer](https://nodemailer.com/): Send e-mails with Node.JS.

#### DEV-Dependencies

- [rimraf](https://github.com/isaacs/rimraf): The UNIX command rm -rf for node.
- [ts-node](https://github.com/TypeStrong/ts-node): TypeScript execution environment and REPL for node.
- [tslint](https://palantir.github.io/tslint/): TSLint checks your TypeScript code for readability, maintainability, and functionality errors.
- [typedoc](http://typedoc.io/): A documentation generator for TypeScript projects.
- [typescript](http://www.typescriptlang.org/): TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.
- [typings](https://github.com/typings/typings): The TypeScript Definition Manager.

## File Structure <a id="file-structure"></a>

We use the component approach in our starter. A component is basically a self contained app usually in a single file or a folder with each concern as a file. Here's how it looks:

```
api-starter-template/
 â”œâ”€ src/                       * our source files that will be compiled to javascript
 |   â”œâ”€ custom-typings.d.ts    * our custom type definitions for typescript
 â”‚   â”‚
 â”‚   â””â”€ app/                   * application folder
 â”‚       â””â”€ app.ts             * app.ts: a simple version of our App component
 â”‚
 â”‚   â””â”€ config/              * our configuration files
 â”‚   â””â”€ app/                   * application folder
 â”‚       â””â”€ app.ts             * app.ts: a simple version of our App component
 â”‚
 â”œâ”€ package.json               * what npm uses to manage it's dependencies
 â”œâ”€ tsconfig.json              * config for typescript
 â”œâ”€ tslint.json                * typescript lint config
 â”œâ”€ typedoc.json               * typescript documentation generator
 â””â”€ typings.json               * our typings manager
```

## Getting Started <a id="getting-started"></a>

### Install system dependencies <a id="install-system-dependencies"></a>

Your system will need access to the `npm` command, so ensure you have the following requirements installed globally;

- [Node.js](https://nodejs.org/en/)
- [NPM](https://www.npmjs.com/)

Once you have Node/npm installed, you should install these globals with `npm install --global`:

- `typescript` (`npm install -g typescript`)
- `typings` (`npm install -g typings`)

### Install the app <a id="install-the-app"></a>

> Run `npm install` to install all dependencies.

Below is an itemized summary of commands that get executed during installation.

```bash
# Install Node/NPM dependencies
npm install
# ...
```

### Run the app <a id="run-the-app"></a>

> Run `npm start` to build and start the application.

The `start` script runs a number of different commands that will clean generated files, run build scripts and start the application. You can examine these commands within the `scripts` property of the `package.json` file.

Below is an itemized summary of the commands that get executed during the `start` script.

```bash
# Clean generated directories/files
rm -rf dist
# Run TypeScript compiler
tsc
```

### Update the app <a id="update-the-app"></a>

> Run `npm run update` to update all dependencies.

Below is an itemized summary of commands that get executed during update.

```bash
# Clear the npm cache folder
npm cache clean
# Update Node/NPM dependencies
npm update
# ...
```

### Uninstall the app <a id="uninstall-the-app"></a>

> Run `npm uninstall` to uninstall all dependencies and remove generated files.

Below is an itemized summary of commands that get executed during uninstall.

```bash
# Uninstall Node/NPM dependencies
npm uninstall
# Clean generated directories/files
rm -rf node_modules dist
```

## TypeScript <a id="typescript"></a>

> To take full advantage of TypeScript with autocomplete you would have to install it globally and use an editor with the correct TypeScript plugins.

### Use latest TypeScript compiler
TypeScript 1.7.x includes everything you need. Make sure to upgrade, even if you installed TypeScript previously.

```
npm install -g typescript
```

### Use a TypeScript-aware editor

Developers have good experience using these editors:

* [Visual Studio Code](https://code.visualstudio.com/)
* [Webstorm 10](https://www.jetbrains.com/webstorm/download/)
* [Atom](https://atom.io/) with [TypeScript plugin](https://atom.io/packages/atom-typescript)
* [Sublime Text](http://www.sublimetext.com/3) with [Typescript-Sublime-Plugin](https://github.com/Microsoft/Typescript-Sublime-plugin#installation)

## Typings <a id="typings"></a>

> When you include a module that doesn't include Type Definitions inside of the module you need to include external Type Definitions with Typings

### Use latest Typings module
```
npm install -g typings
```

### Custom Type Definitions
When including 3rd party modules you also need to include the type definition for the module
if they don't provide one within the module. You can try to install it with typings;

```
typings install dt~node --global --save
```

#### Typings Installed by this repository;
```
typings install dt~core-js dt~js-yaml dt~mocha dt~mssql dt~mysql dt~node dt~node-mysql-wrapper dt~underscore dt~xml2js --global --save
```

#### Search for definitions:
```
typings search tape
```

#### Find an available definition (by name):
```
typings search --name react
```

If you can't find the type definition in the registry we can make an ambient definition in
this file for now. For example

```typescript
declare module "my-module" {
  export function doesSomething(value: string): string;
}
```

If you're prototyping and you will fix the types later you can also declare it as type any

```typescript
declare var assert: any;
```

If you're importing a module that uses Node.js modules which are CommonJS you need to import as

```typescript
import * as _ from 'lodash';
```

You can include your type definitions in this file until you create one for the typings registry
see [typings/registry](https://github.com/typings/registry)

---

# Consumer Platform Auth API documentation version Beta
http://api.taylorandfrancis.com/Beta/
    
---

# API Authentication Strategy <a id="strategy"></a>

We are adhering to oAuth2.0 standards.  A JWT access token is generated upon successful authentication.  The token can be validated via the API route /user/token/authenticate.

---

# API Routes <a id="routes"></a>
    
AuthUser API reference Beta version
https://mocksvc.mulesoft.com/mocks/2b13f76a-4794-4729-bf46-0d52d3400b53/mocks/1cd02915-0218-4cb3-8658-271b8237950e/user/

## /user
A user management API - A point of user management for all of T&F. <br /><br />
Please check out our source code here: http://usmia-gitp2.crcpress.local:7990/projects/CP/repos/authuser-api/browse

### /user/auth/signup
Register a user with basic information First and Last name, username (email) and password.

* **post**: Register a user with basic information First and Last name, username (email) and password.

### /user/auth/login
Authenticate a username and password (login attempt)

* **post**: Authenticate a username and password (login attempt)

### /user/auth/logout
Log a user out

* **post**: Log out a user with their auth token

### /user/auth/authtokenverification
Verify a user's auth token

* **put**: Verify a user's auth token

### /user/auth/registrationverification
Validate a user's registration using the registrationVerificationToken obtained from the user profile.

* **put**: Validate a user's registration using the registrationVerificationToken obtained from the user profile.

### /user/auth/search
Search for a user by their username

* **get**: Search for user with their username

### /user/auth/forgotpassword
Forgot Password Flow - POST the username to generate a resetPasswordToken. PUT username, resetPasswordToken and newPassword to change the user's password.

* **post**: First Step in the Forgot Password flow. This will generate a resetPasswordToken for user {username}.
* **put**: Forgot Password Action

### /user/{id}
Read, Update and Delete users by their ID.

* **get**: Get user information by their ID
* **put**: Update any and all user information with their ID.
* **delete**: Delete user by their ID

---

# TESTING <a id="testing"></a>

Command to set the environment

    set NODE_ENV=test

Command to execute the testcases

    mocha dist/test --recursive

Command to execute testcases with report coverage

    istanbul cover node_modules/mocha/bin/_mocha --  dist/test --recursive