
import path from 'node:path';
import { ApifoxToTSConfig, ApifoxToTSConfigOptions } from './types';
import minimist from 'minimist'
import { accessSync } from 'node:fs';

const CONFIG_FILE_NAME = 'apifox-to-ts.config';

const options: ApifoxToTSConfigOptions = {
  scope: {
    type: "ALL",
    excludedByTags: [],
  },
  oasVersion: '3.1',
  xApifoxApiVersion: '2024-03-28',
  locale: 'zh-CN',
  output: './api-output',
}

export async function loadConfigFile() {
  const configFiles = [`${CONFIG_FILE_NAME}.mjs`, `${CONFIG_FILE_NAME}.cjs`, `${CONFIG_FILE_NAME}.js`];

  for (const file of configFiles) {
    const filePath = path.join(process.cwd(), file);
    try {
      accessSync(filePath);
      if (file.endsWith('.mjs')) {
        return (await import(filePath)).default;
      } else if (file.endsWith('.cjs')) {
        return require(filePath);
      } else if (file.endsWith('.js')) {
        return (await import(filePath)).default;
      }
    } catch (error) {
      console.error(`Failed to load configuration file '${CONFIG_FILE_NAME}':`, error);
    }
  }
}

export async function initConfig() {
  const coverConfig = await loadConfigFile()
  const config: ApifoxToTSConfig = {...options, ...coverConfig}

  // cover config by command
  const commandArgv = minimist(process.argv.slice(2))
  const excludedByTags = commandArgv.excludeTag?.split(',')
  if (commandArgv.selId) {
    config.scope = {
      type: 'SELECTED_ENDPOINTS',
      selectedEndpointIds: commandArgv.selId.split(',').map(Number),
      excludedByTags,
    }
  } else if (commandArgv.selTag) {
    config.scope = {
      type: 'SELECTED_TAGS',
      selectedTags: commandArgv.selTag.split(','),
      excludedByTags,
    }
  } else if (commandArgv.selFolder) {
    config.scope = {
      type: 'SELECTED_FOLDERS',
      selectedFolderIds: commandArgv.selFolder.split(',').map(Number),
      excludedByTags,
    }
  } else if (commandArgv.all) {
    config.scope = {
      type: 'ALL',
      excludedByTags,
    }
  }

  if (config.filterSchema?.parameters?.length) {
    config.filterSchema.parameters = config.filterSchema.parameters.map(key => key.toLowerCase())
  }
  if (config.filterSchema?.requestBody?.length) {
    config.filterSchema.requestBody = config.filterSchema.requestBody.map(key => key.toLowerCase())
  }

  return config
}
