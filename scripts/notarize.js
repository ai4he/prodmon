const { notarize } = require('electron-notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appPath}...`);

  // Use APPLE_APP_SPECIFIC_PASSWORD if available, otherwise fall back to APPLE_ID_PASSWORD
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.APPLE_ID_PASSWORD;

  return await notarize({
    appBundleId: 'com.prodmon.app',
    appPath: appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: appleIdPassword,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
