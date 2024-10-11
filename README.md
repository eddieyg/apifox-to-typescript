# Apifox to TypeScript
Generate TypeScript types and request method code from the Apifox OpenAPI.

## Documentation Language
- [English](./README.md)
- [简体中文](./README-zh.md)

## Usage

### Installation
```shell
npm install apifox-to-typescript -D
```

### Configuration File
Add the `apifox-to-ts.config.mjs` configuration file in the root directory, which can be configured using the `defineApifoxToTSConfig` method (some configurations are optional).

```typescript
import { defineApifoxToTSConfig } from 'apifox-to-typescript'

export default defineApifoxToTSConfig({
  /** Apifox Project ID (required) */
  projectId: "138xxxx",

  /** Apifox OpenAPI Secret Key (required) */
  accessToken: "APS-xxxxxxxxxxxxxxxxxxxxxxxx",

  /**
   * Scope for converting to TypeScript API
   * For detailed parameters, see the Apifox documentation https://apifox-openapi.apifox.cn/api-173411997
   */
  scope: {
    type: 'ALL',
  },

  /** Output directory for the converted TypeScript */
  output: 'api-output',

  /** Remove certain parts of the API path in the output directory */
  rmOutputPath: [/^\/api/],

  /** Filter out certain fields when converting to TypeScript */
  filterSchema: {
    parameters: ['content', 'sign'],
    requestBody: ['content', 'sign']
  },

  /** Template for generating API request functions */
  template: {
    import: () => `
import { queryClient } from "@/api/client"
  `,
    get: (data) => `
export async function ${data.name}Api(params: ${data.req}):Promise<${data.res}> {
  const res = await queryClient.get(
    "${data.path}",
    { searchParams: params },
  ).json()
  return res
}`,

    post: (data) => `
export async function ${data.name}Api(params: ${data.req}):Promise<${data.res}> {
  const res = await queryClient.post(
    "${data.path}",
    { json: params },
  ).json()
  return res
}`,

  }
})

```

### Execute Command

```shell
npx apifox-to-ts

# Command line parameters override scope configuration
# --all
# --selId=138xxxx,139xxxx
# --selTag=user,login
# --selFolder=180xxxx
```
