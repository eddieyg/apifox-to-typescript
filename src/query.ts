import { ApifoxToTSConfig } from "./types";

export async function queryApifoxExport(config: ApifoxToTSConfig) {
   const headers = new Headers();
   headers.append("X-Apifox-Api-Version", config.xApifoxApiVersion!);
   headers.append("Authorization", `Bearer ${config.accessToken}`);
   headers.append("User-Agent", "Apifox/1.0.0 (https://apifox.com)");
   headers.append("Content-Type", "application/json");
   
   var body = JSON.stringify({
      scope: config.scope,
      oasVersion: config.oasVersion,
      options: {
         includeApifoxExtensionProperties: false,
         addFoldersToTags: false
      },
      exportFormat: "JSON"
   });
   
   const url = `https://api.apifox.com/v1/projects/${config.projectId}/export-openapi?locale=${config.locale}`
   
   try {
      const response = await fetch(url, { 
         method: 'POST', 
         redirect: 'follow',
         headers,
         body,
      })
      const res = await response.text()
      return res
   } catch(error) {
      console.error('query api fail:', error)
   }
}
