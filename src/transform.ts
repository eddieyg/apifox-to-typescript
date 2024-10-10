import fsExtra from 'fs-extra/esm'
import { compile, JSONSchema } from 'json-schema-to-typescript'
import { ApifoxToTSConfig } from './types'
import { cwdPath, toPascalCase, toCamelCase } from './utils'
import fs from 'node:fs';

interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required: boolean;
  schema: {
    type: string;
    format?: string;
  };
}

export function convertQueryParametersToSchema(parameters: Parameter[]): JSONSchema {
  const schema: JSONSchema = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const param of parameters) {
    if (param.in === 'query') {
      schema.properties![param.name] = {
        type: param.schema.type as any,
        required: param.required
      };
      if (param.required) {
        (schema.required as string[]).push(param.name);
      }
    }
  }

  return schema;
}

function transformSchema (schema?: JSONSchema, filterSchema?: string[]) {
  if (!schema) {
    const emptyObjSchema: JSONSchema = {
      properties: {},
      type: "object"
    }
    return emptyObjSchema
  }

  const result: JSONSchema = JSON.parse(JSON.stringify(schema))
  for (let key in result.properties) {
    const item = result.properties[key]
    if (filterSchema?.includes(key.toLowerCase())) {
      delete result.properties[key]
    }
    // merge title and description 
    if (item.title) {
      item.description = [item.title, item.description].filter(Boolean).join(': ')
      delete item.title
    }
  }
  return result
}

export async function transformTs(config: ApifoxToTSConfig, data: any) {
  console.log("typescript transform...")
  const options = {
    bannerComment: '',
    // unknownAny: false,
  }

  for (const apiPath in data.paths) {
    const item = data.paths[apiPath]
    const apiPaths = apiPath.split('/')
    const fileName = apiPaths.pop()!
    const apiName = toPascalCase(fileName)
    const apiNameCC = toCamelCase(fileName)
    const apiTypeName = {
      getReq: apiName + 'GetReq',
      getRes: apiName + 'GetRes',
      postReq: apiName + 'PostReq',
      postRes: apiName + 'PostRes',
    }

    const compiles = []
    if (item.get) {
      compiles.push(
        compile(
          transformSchema(
            convertQueryParametersToSchema(item.get.parameters), 
            config.filterSchema?.parameters
          ), 
          apiTypeName.getReq,
          options
        ),
        compile(
          transformSchema(
            item.get.responses['200'].content[`application/json`]?.schema,
          ), 
          apiTypeName.getRes,
          options
        )
      )
    } else {
      compiles.push(undefined, undefined)
    }
    if (item.post) {
      compiles.push(
        compile(
          transformSchema(
            item.post.requestBody?.content[`application/json`]?.schema,
            config.filterSchema?.requestBody
          ), 
          apiTypeName.postReq,
          options
        ),
        compile(
          transformSchema(
            item.post.responses['200'].content[`application/json`]?.schema,
          ),
          apiTypeName.postRes,
          options
        )
      )
    } else {
      compiles.push(undefined, undefined)
    }
    const [getReq, getRes, postReq, postRes] = await Promise.all(compiles)

    const tsContent = []
    if (config.template?.import) {
      tsContent.push(
        config.template.import()
      )
    }
    if (getReq && getRes) {
      tsContent.push(
        getReq, 
        getRes,
      )
      if (config.template?.get) {
        tsContent.push(
          `/** ${item.get.summary} */` + 
          config.template.get({
            name: apiNameCC + 'Get',
            req: apiTypeName.getReq,
            res: apiTypeName.getRes,
            path: apiPath,
          })
        )
      }
    }
    if (postReq && postRes) {
      tsContent.push(
        postReq, 
        postRes,
      )
      if (config.template?.post) {
        tsContent.push(
          `/** ${item.post.summary} */` + 
          config.template.post({
            name: apiNameCC + 'Post',
            req: apiTypeName.postReq,
            res: apiTypeName.postRes,
            path: apiPath,
          })
        )
      }
    }

    let filePath = cwdPath(config.output!)
    if (config.rmOutputPath?.length) {
      const originApiPath = apiPaths.join('/')
      config.rmOutputPath.some(reg => {
        if (reg.test(originApiPath)) {
          filePath += originApiPath.replace(reg, '')
          return true
        }
        return false
      })
    } else {
      filePath += apiPaths.join('/')
    }

    fsExtra.ensureDirSync(filePath)
    fs.writeFileSync(filePath + '/' + fileName + '.ts', tsContent.join('\n') + '\n')

    console.log(filePath, apiName)
  }
  console.log("typescript transform done!")
}
