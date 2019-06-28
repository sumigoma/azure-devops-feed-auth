# azure-devops-feed-auth

This utility is an authentication bootstrapper for npm feeds in Azure DevOps (Azure Artifacts). Unlike Microsoft's official [vsts-npm-auth](https://www.npmjs.com/package/vsts-npm-auth) tool, this alternative is platform-agnostic and will work on Windows, Mac and Linux. Moreover, the use of Azure DevOps Personal Access Tokens (PATs) is simple and allows for the configuration of a custom expiration date up to a year. By configuring this script to run as a `preinstall` step in your project, you can ensure that your current PAT is valid prior to attempting the installation of any npm packages hosted in an Azure DevOps feed. If your PAT is invalid or expired, this script will also provide simple instructions on how to retrieve and apply a new token for your convenience.

## Prerequisites

- Azure DevOps
- NodeJS >=10.0.0
- npm >=6.9.0
- Git >=2.0.0

Note that you should have NodeJS and Git installed on your machine, and you should have already set a global git username and password prior to running this script (See https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup#_your_identity).

You must also have an Azure DevOps account, and have the ability to create a personal access token for yourself at <https://{myorganization}.visualstudio.com/_usersSettings/tokens>.

Finally, you MUST create a `.npmrc` file at the root of your npm project with the following contents,

```
{@myscope:}registry=https://{myorganization}.pkgs.visualstudio.com/_packaging/{feedname}/npm/registry/
always-auth=true
engine-strict=true

```

Please note that all terms in `{}` are optional. If your feed only contains scoped packages, replace `{@myscope:}` with the **name of your scope**. Otherwise, the line should simply start with `registry=`. You should also replace the `{myorganization}` before `.pkgs.visualstudio.com` with your **Azure DevOps organization name** and `{feedname}` with the name of your **Azure DevOps (Azure Artifacts) package feed**.

## Installation

_azure-devops-feed-auth_ is best used as a preinstall script within your `package.json` file, e.g.

```

  "scripts": {
    ...
    "preinstall": "azure-devops-feed-auth --testPackage @myscope/mypackage",
    ...
  },

```

where `--testPackage` must be a package that exists in your Azure DevOps package feed. This test package will be used to attempt authentication against the feed by invoking `npm view` to test access. If authentication fails (e.g. due to an expired personal access token, or PAT), the script will provide a simplified way to update the `.npmrc` file in your user profile with a new PAT.

It is also recommended to have the following at the end of your `package.json` file to ensure all developers have met the minimum requirements for NodeJS and npm. Older versions of node and npm are known to cause authentication issues on some platforms.

```
{
  ...
  "devDependencies": {
    ...
  },
  "engines": {
    "node": ">=10.0.0",
    "npm": ">=6.9.0"
  }
}


```

## How to use

To use this package, simply add the preinstall hook to `package.json` as described above and run `npm install` as usual. (If applying to an existing project, please make sure to run `npm cache clean`, remove `node_modules` and delete the `package-lock.json` file for good measure.)

If authentication against the Azure DevOps package feed succeeds with the test package you provide to this script, the preinstall step will quietly exit and allow the installation of all packages from your Azure DevOps feed. If authentication fails, the script will provide instructions on how to retrieve a new personal access token (PAT) from the Azure DevOps website. These are the same instructions:

1. Re-generate your personal access token (PAT) or generate a new one in Azure DevOps by navigating to <https://{myorganization}.visualstudio.com/_usersSettings/tokens> and doing the following:
2. Click "+ New Token"
   ![Create](https://docs.microsoft.com/en-us/azure/devops/repos/git/_shared/_img/add-personal-access-token.png)
3. Provide a name for the token, e.g. "Azure DevOps package feed"
   ![Name](https://docs.microsoft.com/en-us/azure/devops/repos/git/_shared/_img/setup-personal-access-token.png)
4. Use datepicker to set Expiration (UTC) to a future date, e.g. one year from now
5. Select **Custom defined** for Scopes
6. Expand by clicking **Show all scopes (27 more)** text below
7. Scroll down to "Packaging" and check "Read & write"
8. Click "Create" to create the token
9. Copy the newly created PAT
   ![Paste](https://docs.microsoft.com/en-us/azure/devops/repos/git/_shared/_img/create-personal-access-token.png)
10. Paste into the command prompt from the script

After pasting the new PAT from the Azure DevOps page into the command prompt and hitting enter, this script will make the necessary changes to the `.npmrc` file in your user profile to allow successful authentication. Your `npm install` should then proceed without issues.

Please note that upon expiration of the PAT from Azure DevOps, you may have to provide a new token the next time you run `npm install` and the preinstall step fails. You can do this by simply clicking on "+Regenerate" next to your existing token in the <https://{myorganization}.visualstudio.com/_usersSettings/tokens> page.
