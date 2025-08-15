import "react-native-url-polyfill/auto";      // 1) Polyfill global URL
import "react-native-get-random-values";       // 2) Polyfill crypto.getRandomValues
import { registerRootComponent } from "expo";  // si usas Expo
import App from "./App";                       // tu App.tsx

// 3) Registra tu App como componente raíz
registerRootComponent(App);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately 