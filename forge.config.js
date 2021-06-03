module.exports = {
  "packagerConfig": {
    "icon": "./src/assets/icon",
    osxSign: {
      entitlements: './entitlements.plist',
      'entitlements-inherit': './entitlements.plist',
      'gatekeeper-assess': false,
      hardenedRuntime: true,
      identity: 'Apple Development: Roshan Choxi (SC7ANJ9LFR)'
    },
    osxNotarize: {
      appleId: process.env['APPLE_ID'],
      appleIdPassword: process.env['APPLE_ID_PASSWORD'],
      ascProvider: "9M9C2KP3Y8"
    },
  },
  "publishers": [
    {
      "name": "@electron-forge/publisher-github",
      "config": {
        "repository": {
          "owner": "choxi",
          "name": "pixel"
        },
        "prerelease": true
      }
    }
  ],
  "makers": [
    {
      "name": "@electron-forge/maker-squirrel",
      "config": {
        "name": "pixel"
      }
    },
    {
      "name": "@electron-forge/maker-zip",
      "platforms": [
        "darwin"
      ]
    },
    {
      "name": "@electron-forge/maker-deb",
      "config": {}
    },
    {
      "name": "@electron-forge/maker-rpm",
      "config": {}
    }
  ],
  "plugins": [
    [
      "@electron-forge/plugin-webpack",
      {
        "mainConfig": "./webpack.main.config.js",
        "renderer": {
          "config": "./webpack.renderer.config.js",
          "entryPoints": [
            {
              "html": "./src/index.html",
              "js": "./src/renderer.ts",
              "name": "main_window"
            }
          ]
        }
      }
    ]
  ]
}