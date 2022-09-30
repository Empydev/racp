# rAthena Control Panel

Not ready for public use. Use at your own risk.

[Demo](http://139.59.197.170)

## Design goals

<details>
    <summary>Minimal configuration</summary>
    
> Just install and run. RACP will read all data from either the rAthena data files or mysql database.

</details>

<details>
    <summary>Total abstraction</summary>

> RACP contains no data. No fixtures, no enums, nothing. RACP will read all data from either the rAthena data files or mysql database and the RO client files.

</details>

<details>
    <summary>Integration stability</summary>

> Unit and E2E tests run on each commit and will run against the latest rathena version.

</details>

<details>
    <summary>Function over form</summary>

> The UI prioritizes functionality over aesthetics. Does not support theming, keeps things simple.

</details>

## Prerequisites

To run RACP you will need the following software installed on your machine:

- [Node.js](https://nodejs.org/en/)
- [Mysql](https://www.mysql.com/)
- [Java](https://www.java.com/)
- [rAthena](https://github.com/rathena/) (Or a fork)

## Development

- Install rAthena on the same machine as RACP.
- Create a new file `.env.local` in the project root folder
- Add the following to the file, but substitute `<path>` with the absolute path to your rAthena folder:

```
rAthenaPath=<path>
```

- Open a terminal and navigate to the project root
- Run `yarn api:dev` to start the api in dev mode.
- Run `yarn app:dev` to start the app in dev mode.
- Visit `http://localhost:8080/` in your browser.

## Deployment

### Manual

This is a fairly standard React + Express.js application, so you can use the provided [scripts](package.json) to manually manage a production deployment if you have the technical experience to do so.

### Automatic

RACP comes with a built-in deployment process that will automatically deploy the latest
version of RACP to a server of your choice whenever you make changes to the repository.

This process has **additional** prerequisites for your server:

- Must be a UNIX server.
- Requires [PM2](https://pm2.keymetrics.io/) to be installed.

To use the automatic deployment:

- Fork this repository
- Add the following [GitHub Action Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository) to your fork's repository settings:
  - `DEPLOY_HOST` - The host of the server to deploy to
  - `DEPLOY_USERNAME` - The ssh username to connect with when deploying
  - `DEPLOY_PASSWORD` - The ssh password to connect with when deploying
  - `DEPLOY_API_PORT` - The port to run the api on (Whatever port you want)
  - `DEPLOY_APP_PORT` - The port to run the web app on (80 is recommended, but it's up to you)
  - `DEPLOY_RATHENA_PATH` - The absolute path to the rAthena folder on your server
  - `DEPLOY_ENABLED` - Set to true to enable automatic deployment
- GitHub will now deploy automatically whenever you push changes to the main branch of your fork.
