#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

exports.validateProjectNpmrc = () => {
  const projectNpmrc = path.resolve(process.cwd(), '.npmrc');
  let data;

  try {
    data = fs.readFileSync(projectNpmrc, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(
        'Project .npmrc does not exist. Please create one and set the Azure Artifacts registry URL.',
      );
    } else throw err;
  }

  const pattern = /@?[a-zA-Z0-9_]*:?registry=https:(\/\/[a-zA-Z0-9_]*.pkgs.visualstudio.com\/_packaging\/[a-zA-Z0-9_]*\/npm\/registry\/)/i;
  const matches = data.match(pattern);

  if (!matches) {
    throw new Error('No Azure Artifacts registry specified in project .npmrc file.');
  } else {
    return matches[1]; // return url substring after https:
  }
};

// attempt to `npm view` the test package as a means to test authentication
exports.isAuthenticated = package => {
  try {
    execSync(`npm view ${package}`, { stdio: 'ignore' });
    return true;
  } catch (err) {
    return false;
  }
};

exports.getUsername = () => {
  // fetch username from global git config
  try {
    return execSync('git config --global user.name')
      .toString()
      .trim();
  } catch (err) {
    throw new Error(
      '\nPlease set your git username: e.g. $ git config --global user.name "John Doe"\n',
    );
  }
};

exports.getEmail = () => {
  // fetch email from global git config
  try {
    return execSync('git config --global user.email')
      .toString()
      .trim();
  } catch (err) {
    throw new Error(
      '\nPlease set your git email: e.g. $ git config --global user.email johndoe@example.com\n',
    );
  }
};

exports.updateUserNpmrc = (url, username, email, password, alwaysAuth) => {
  const userNpmrc = path.resolve(os.homedir(), '.npmrc');
  let data;
  try {
    data = fs.readFileSync(userNpmrc, 'utf8');
  } catch (err) {
    if (err) throw new Error(err);
  }

  const keepLines = data
    .split('\n')
    .filter(val => !val.startsWith(url)) // keep unrelated content that doesn't start with the url
    .join('\n');

  const addLines = `${url}:username=${username}
${url}:email=${email}
${url}:_password=${password}
${url}:always-auth=${alwaysAuth}
`;

  fs.writeFileSync(userNpmrc, keepLines + addLines, {
    encoding: 'utf8',
  });
  console.log(
    chalk.bold(
      '\nThe .npmrc file in your user profile has been updated with the new PAT.\nProceeding to npm install...\n',
    ),
  );
};
