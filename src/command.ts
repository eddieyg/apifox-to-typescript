#!/usr/bin/env node

import { initConfig } from "./config"
import { queryApifoxExport } from "./query";
import { transformTs } from "./transform";

async function main() {
  console.log("apifox to typescript starting...");
  const config = await initConfig()
  if (!config) {
    return
  }
  console.log("apply scope: ", config.scope, '\n');

  const res = await queryApifoxExport(config)
  if (!res)
    return
  // console.log("query openapi:", res);

  await transformTs(config, JSON.parse(res))
}

main()
