// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // La config web de Firebase no es secreta: los datos se protegen con reglas de Firestore + Auth.
  firebase: {
    apiKey: 'AIzaSyBWroOARbudVc1VhE2CSkFpHV7wTLMjkc8',
    authDomain: 'houseapp-8d4cc.firebaseapp.com',
    projectId: 'houseapp-8d4cc',
    storageBucket: 'houseapp-8d4cc.firebasestorage.app',
    messagingSenderId: '989154693098',
    appId: '1:989154693098:web:b173e8dae7e760dd24ec93',
  },
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
