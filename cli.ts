#! /usr/bin/env node

import fetch from "node-fetch";
import { Command } from "commander";


(async () => {

  const program = new Command();

  program
    .name("csd-scan")
    .usage("-u <url> -e <url>")
    .description("CLI tool that check if a web-server endpoint have a possible client-side desync vulnerability.")
    .option("-u, --url <url>", "Possible vulnerable endpoint URL.")
    .option("-e, --error-url <url>", "Url used for inject request in the first request body.\nA GET request to this url MUST return an error status code ( from 400 to 599 ).")
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

        console.log("start", cmd.url, cmd.errorUrl)

        const url = new URL(cmd.url);
        const errorUrl = new URL(cmd.errorUrl);

        console.log("start2")
        console.log(url)

        if (url.host !== errorUrl.host) {
          console.error("URL and ERROR-URL must be for the same host ");
          process.exit(1);
        }

        // Expected status code that second request have to return for being vulnerable
        const errorUrlResponse = (await fetch(errorUrl, { redirect: "manual" }));

        if (errorUrlResponse.status <= 399) {
          console.error("Requests (GET) to ERROR-URL must return an error code (from 400 to 599)");
          process.exit(1);
        }

        await fetch(url, {
          method: "POST",
          redirect: "manual",
          body: `GET ${errorUrl.pathname + errorUrl.search} HTTP/1.1\r\nX: Y`,
        });

        // Request to root path
        const response = await fetch(url.protocol + url.host);

        if (response.status === errorUrlResponse.status) {
          console.log(`VULNERABLE: ${url.host} ingore request Content-Length at '${url.pathname + url.search}' path `);
        } else {
          console.log("Nothing found ...")
        }
      } catch (error) {
        console.error("Error fetching the URL:", error);
      }
    });

  await program.parseAsync(process.argv);

})();
