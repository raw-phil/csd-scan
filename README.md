# csd-scan
Inspired by James Kettle’s research on [Browser-Powered Desync Attacks](https://portswigger.net/research/browser-powered-desync-attacks), I decided to write a simple CLI tool 
to automate the scanning of a web server for [Client-side desync](https://portswigger.net/research/browser-powered-desync-attacks#csd) vulnerabilities.


**csd-scan** will send a POST request to the first `URL` ( **which is the endpoit to test for vuln** ) with an incomplete GET request to `ERROR_URL` path in the body.

```
POST /FIRST_URL_PATH\r\n
Host: vulnerable-site.com\r\n
Content-Length: 23\r\n
\r\n
GET /ERROR_URL_PATH HTTP/1.1\r\n
X: Y
```

Then it sends a GET request to the root path ('/'), and if it return the status code of the `GET /ERROR_URL_PATH HTTP/1.1` means that the server ignore Content-Length of the POST request and that the connection is successfully poisoned.

```
GET /ERROR_URL_PATH HTTP/1.1
X: YGET / HTTP/1.1
Host: vulnerable-site.com
```

**csd-scan** uses [node-fetch](https://www.npmjs.com/package/node-fetch) to make the test more realistic since the attack will be lauched from a web browser


## Install

Require 

```bash
git clone https://github.com/raw-phil/csd-scan.git
cd csd-scan
npm i
npm run build
npm link
```

### Docker

#### Build image
```bash
git clone https://github.com/raw-phil/csd-scan.git
cd csd-scan
docker build -t csd-scan .
```
#### Run
```bash
docker run --rm csd-scan
```

## Usage

```bash
$ csd-scan --help

Usage: csd-scan -u <url> -e <url>

CLI tool that check if a web-server endpoint have a possible client-side desync vulnerability.

Options:
  -u, --url <url>        Possible vulnerable endpoint URL.
  -e, --error-url <url>  Url used for inject request in the first request body.
                         A GET request to this url MUST return an error status code ( from 400 to 599 ).
  -h, --help             display help for command


Examples:
  $ cli-tool --url https://example.com --error-url https://example.com/hope404
  $ cli-tool -u https://example.com --e https://example.com/hope404
```


### Arguments
**csd-scan** needs two arguments to work:

- URL passed with `-u` or `--url` flag, is the url that indicate where scan for the vulnerability

- ERROR_URL passed with `-e` or `--error-url`, is the url used to inject the second request in the body of the first.
A GET request to this url MUST return an error status code ( from 400 to 599 ). This is necessary to determine if the body of the first request affects the response of the second request, which should return a different status code than the second request to the root path.