// import { defineApifoxToTSConfig } from './src/index'

export default {
  projectId: process.env.PROJECT_ID,
  accessToken: process.env.ACCESS_TOKEN,
  scope: {
    type: 'SELECTED_ENDPOINTS',
    selectedEndpointIds: [
      191819528, 
      191955218,
      // 220654312,
      221097290,
      41360731,
      41342560,
      42754899,
      41817934,
    ]
  },
  
  output: 'api-output',
  rmOutputPath: [/^\/pc/],

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
}
