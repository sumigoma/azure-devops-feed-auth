#!/usr/bin/env node

const utils = require('./utils');
const process = require('process');
const chalk = require('chalk');
const argv = require('yargs')
  .usage(
    'Configures user .npmrc to authenticate against Azure DevOps package feed.\nUsage: $0 -p <testPackage>',
  )
  .demandOption('p')
  .alias('p', 'testPackage')
  .describe('p', 'An npm package in the Azure DevOps package feed to test authentication')
  .string('p')
  .alias('u', 'username')
  .describe('u', 'Override username (default: git config --global user.name)')
  .string('u')
  .alias('e', 'email')
  .describe('e', 'Override email (default: git config --global user.email)')
  .string('e')
  .alias('a', 'alwaysAuth')
  .describe('a', 'Override always-auth (default: true)')
  .boolean('a')
  .default('a', true)
  .showHelpOnFail(false, 'Specify --help for available options')
  .help('help').argv;

// need to check first whether project .npmrc exists
// otherwise this script will not attempt to access the test package from the Azure DevOps package feed
const url = utils.validateProjectNpmrc();

// now check whether the user is authenticated by attempting npm view
if (utils.isAuthenticated(argv.testPackage)) {
  process.exit(); // the user is already authenticated, there is nothing to be done
}

// read username and email from global git config
const username = argv.username || utils.getUsername();
const email = argv.email || utils.getEmail();

// prompt user for Azure DevOps PAT
const { createInterface } = require('readline');
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  chalk.red(
    '\nError: Azure DevOps package feed authentication failed due to invalid personal access token (PAT)\n',
  ),
);

rl.question(
  `Please re-generate the token or generate a new one in Azure DevOps by navigating to https://{myorganization}.visualstudio.com/_usersSettings/tokens and doing the following
  - Provide a name for the token, e.g. "Azure DevOps package feed"
  - Use datepicker to set Expiration (UTC) to a future date, e.g. one year from now
  - Select "Custom defined" for Scopes
  - Expand by clicking "Show all scopes (27 more)" text below
  - Scroll down to "Packaging" and check "Read & write"
  - Click "Create" to create the token\n
and then paste your newly created PAT below:\n>>>`,
  PAT => {
    const encodedPAT = new Buffer.from(PAT).toString('base64');
    utils.updateUserNpmrc(url, username, email, encodedPAT, argv.alwaysAuth);
    rl.close();
  },
);
