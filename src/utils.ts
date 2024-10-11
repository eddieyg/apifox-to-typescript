

import fs from 'fs-extra';
import path from 'node:path';

export function ensureDirJsonSync(pathStr: string, data: string) {
  const paths = pathStr.split('/')
  const file = paths.pop()
  fs.ensureDirSync(paths.join('/'))
  fs.writeJsonSync([...paths, file].join('/'), data)
}

export function cwdPath(...pathStr: string[]){
  const projectRoot = process.cwd()
  return path.join(projectRoot, ...pathStr);
}

export function toCamelCase(input: string): string {
  return input
    .split(/[/_]/)
    .map((word, index) => {
      return index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

export function toPascalCase(input: string): string {
  return input
    .split(/[/_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toArray(value: string | number, toInt: true): number[]
export function toArray(value: string | number, toInt?: false): string[]

export function toArray(value: string | number, toInt = false) {
  if (!value && value !== 0)
    return []
  if (typeof value === 'number') {
    return [value]
  }
  const arr = value.split(',')
  return toInt ? arr.map(Number) : arr
}
