
export interface ExportAllScope {
  type: "ALL"
  excludedByTags?: string[]
}

export interface ExportSelectScope {
  type: "SELECTED_ENDPOINTS"
  selectedEndpointIds?: number[]
  excludedByTags?: string[]
}

export interface ExportTagScope {
  type: "SELECTED_TAGS"
  selectedTags?: string[]
  excludedByTags?: string[]
}

export interface ExportFolderScope {
  type: "SELECTED_FOLDERS"
  selectedFolderIds?: number[]
  excludedByTags?: string[]
}

export interface options {
  includeApifoxExtensionProperties: boolean
  addFoldersToTags: boolean
}

export type Scope = | ExportAllScope
    | ExportSelectScope
    | ExportTagScope
    | ExportFolderScope

export interface ApifoxBody {
  scope: Scope
  options?: options
  oasVersion?: "3.0" | "3.1" | "2.0"
  exportFormat?: "JSON" | "YAML"
  environmentIds?: number[]
}

export interface TemplateParams {
  name: string
  req: string
  res: string
  path: string
}

export interface ApifoxToTSConfigOptions {
  scope?: Scope
  oasVersion?: string

  xApifoxApiVersion?: string
  locale?: string

  output?: string
  rmOutputPath?: RegExp[]

  template?: {
    import?: () => string;
    get?: (data: TemplateParams) => string;
    post?: (data: TemplateParams) => string;
  }
  filterSchema?: {
    parameters?: string[];
    requestBody?: string[];
  }
}

export interface ApifoxToTSConfig extends ApifoxToTSConfigOptions {
  accessToken: string
  projectId: string
}
