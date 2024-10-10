# Apifox to typescript
通过 Apifox 的 open-api，生成 typescript 类型和请求方法的代码。

## 文档语种
- [English](./README.md)
- [简体中文](./README-zh.md)

## 使用

### 安装
```shell
npm install apifox-to-typescript -D
```

### 配置文件
根目录添加 `apifox-to-ts.config.mjs` 配置文件，可通过 `defineApifoxToTSConfig` 方法配置（部分配置为可选）。

```typescript
import { defineApifoxToTSConfig } from 'apifox-to-typescript'

export default defineApifoxToTSConfig({
  projectId: "138xxxx",
  accessToken: "APS-xxxxxxxxxxxxxxxxxxxxxxxx",
  scope: {
    type: 'ALL',
  },
  
  output: 'api-output',
  rmOutputPath: [/^\/api/],

  filterSchema: {
    parameters: ['content', 'sign'],
    requestBody: ['content', 'sign']
  },

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

### 执行命令

```shell
npx apifox-to-ts

# 命令行参数覆盖 scope 配置
# --all
# --selId=138xxxx,139xxxx
# --selTag=user,login
# --selFolder=180xxxx
```
