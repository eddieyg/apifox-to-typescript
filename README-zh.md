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
  /** Apifox 项目ID（必填） */
  projectId: "138xxxx",

  /** Apifox openapi 秘钥（必填） */
  accessToken: "APS-xxxxxxxxxxxxxxxxxxxxxxxx",

  /**
   * 转换TS的API范围
   * 参数详见 apifox 文档 https://apifox-openapi.apifox.cn/api-173411997
   */
  scope: {
    type: 'ALL',
  },

  /** 转换TS的产出目录 */
  output: 'api-output',

  /** 删除产出目录中 API 路径的部分 */
  rmOutputPath: [/^\/api/],

  /** 转换TS时过滤掉某些字段 */
  filterSchema: {
    parameters: ['content', 'sign'],
    requestBody: ['content', 'sign']
  },

  /** 生成API请求函数的模版 */
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
