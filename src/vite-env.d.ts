/// <reference types="vite/client" />

import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

declare module "*.png" {
  const value: string;
  export default value;
}
