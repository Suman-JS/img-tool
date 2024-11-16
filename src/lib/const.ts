import gradient from "gradient-string";

export const VERSION = "0.1.2";

const NAME = `
     _                       __              __    
    (_)___ ___  ____ _      / /_____  ____  / /   
   / / __ \`__ \\/ __ \`/_____/ __/ __ \\/ __ \\/ /   
  / / / / / / / /_/ /_____/ /_/ /_/ / /_/ / /   
 /_/_/ /_/ /_/\\__, /      \\__/\\____/\\____/_/   v${VERSION} by Suman
             /____/                             `;

export const appName = gradient(["#9bf8f4", "#6f7bf7"])(NAME);
