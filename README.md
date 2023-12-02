# Media Server Stack

My media server is hosted with Docker Swarm. This repo consists of a Docker Compose file written in Jsonnet and compiled to JSON (works with any YAML parser because JSON is a subset of YAML).

My main server is called Haring (following my device hostname naming scheme of Dutch food).

Compile and copy to clipboard in WSL:
```bash
jsonnet haring.jsonnet -o haring.json && win32yank.exe -i < haring.json
```
