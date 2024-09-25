#!/usr/bin/env ts-node

import fetch from "node-fetch";
import { Command } from "commander";


(async () => {

  const program = new Command();

  program
    .name("csd-scan")
    .usage("-u <url> -e <url>")
    .description("CLI tool to check if a web-server endpoint have a possible client-side desync vulnerability.")
    .option("-u, --url <url>", "Possible vulnerable endpoint URL.")
    .option("-e, --error-url <url>", "Url used for inject request in the first request body.\nA GET request to this url MUST return a different status code than the first ulr.")
    .on("--help", () => {
      console.log("\n\nExamples:");
      console.log("  $ cli-tool --url https://example.com --error-url https://example.com/hope404");
      console.log("  $ cli-tool -u https://example.com --e https://example.com/hope404");
    })
    .action(async (cmd) => {

      try {

        if (!cmd.url || !cmd.errorUrl) {
          console.error("Please provide a URL using --url or -u, and a ERROR-URL using --error-url or -e ");
          process.exit(1);
        }

        const url = new URL(cmd.url);
        const errorUrl = new URL(cmd.errorUrl);

        if (url.host !== errorUrl.host) {
          console.error("URL and ERROR-URL must be for the same host ");
          process.exit(1);
        }

        // Expected status code that second request have to return for being vulnerable
        const errorUrlResponse = (await fetch(errorUrl));

        const inputUrlResponse = (await fetch(url, { redirect: "manual" }));

        if (errorUrlResponse.status === inputUrlResponse.status) {
          console.error("Requests (GET) to URL and ERROR-URL have to return two different status code ");
          process.exit(1);
        }

        await fetch(url, {
          method: "POST",
          redirect: "manual",
          body: `GET ${errorUrl.pathname + errorUrl.search} HTTP/1.1\r\nFoo: x`,
        });

        const response = await fetch(url);

        if (response.status === errorUrlResponse.status) {
          console.log(`VULNERABLE: ${url.host} ingore request Content-Length at '${url.pathname + url.search}' path `);
        }else{
          console.log("Nothig found ...")
        }
      } catch (error) {
        console.error("Error fetching the URL:", error);
      }
    });

  await program.parseAsync(process.argv);

})();
