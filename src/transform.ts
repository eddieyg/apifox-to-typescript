import fsExtra from 'fs-extra/esm'
import { compile, JSONSchema } from 'json-schema-to-typescript'
import { ApifoxToTSConfig } from './types'
import { cwdPath, toPascalCase, toCamelCase } from './utils'
import fs from 'node:fs';
import path from 'node:path';

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
    if (item.type === 'object') {
      result.properties[key] = transformSchema(item, filterSchema)
    } else if (item.type === 'array') {
      item.items = transformSchema(item.items, filterSchema)
    }
  }
  return result
}

function generateExportTsCode(exportFiles: string[]) {
  const result = exportFiles
    .map(file => `export * from "./${file}"`)
    .join('\n')
  return result ? result + '\n' : result
}

function rmPath(pathStr: string, rmPathReg?: RegExp[]) {
  if (rmPathReg?.length) {
    rmPathReg.some(reg => {
      if (reg.test(pathStr)) {
        pathStr = pathStr.replace(reg, '')
        return true
      }
      return false
    })
  }
  return pathStr
}


export async function transformTs(config: ApifoxToTSConfig, data: any) {
  console.log("typescript transform...")
  const options = {
    bannerComment: '',
    // Compat https://github.com/bcherny/json-schema-to-typescript/issues/640
    customName: (schema?: JSONSchema) => {
      if (schema?.title && /\d/.test(schema.title)) {
        return 'FillNoName'
      }
    }
  }
  const exportFiles: string[] = []

  for (const apiPath in data.paths) {
    const item = data.paths[apiPath]
    const apiPaths = apiPath.split('/')
    const fileName = apiPaths.pop()!
    const methodNamePath = rmPath(apiPath, config.rmOutputPath)
    const apiName = toPascalCase(methodNamePath)
    const apiNameCC = toCamelCase(methodNamePath)
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

    let outputApiPath = rmPath(apiPaths.join('/'), config.rmOutputPath)
    const filePath = cwdPath(config.output!, outputApiPath + '/')
    fsExtra.ensureDirSync(filePath)
    fs.writeFileSync(
      path.join(filePath, `${fileName}.ts`), 
      tsContent.join('\n') + '\n'
    )
    
    const exportFilePath = path.join('.', outputApiPath, fileName)
    if (!exportFiles.includes(exportFilePath)) {
      exportFiles.push(exportFilePath)
    }
    
    console.log(
      path.join(config.output!, exportFilePath + '.ts')
    )
  }

  // export entry index.ts
  const exportIndexPath = cwdPath(config.output!, 'index.ts')
  if (fs.existsSync(exportIndexPath)) {
    const indexContent = fs.readFileSync(exportIndexPath, 'utf-8')
    const newExports = exportFiles.filter(file => !indexContent.includes(file))
    fs.writeFileSync(
      exportIndexPath, 
      indexContent + generateExportTsCode(newExports)
    )
  } else {
    fs.writeFileSync(
      exportIndexPath, 
      generateExportTsCode(exportFiles)
    )
  }

  console.log("typescript transform done!\n")
}
