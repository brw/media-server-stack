# Media Server Stack (Old)

### This is an old version of my media server config. The new version using Pulumi can be found [here](../..). The Docker Swarm setup is only kept for reference.

My media server is hosted with Docker Swarm. This repo consists of a Docker Compose file written in Jsonnet and compiled to JSON (works with any YAML parser because JSON is a subset of YAML).

My main server is called Haring (following my device hostname naming scheme of Dutch food).

Compile and copy to clipboard in WSL:
```bash
jsonnet haring.jsonnet -o haring.json && win32yank.exe -i < haring.json
```
or under Wayland
```bash
jsonnet haring.jsonnet -o haring.json && wl-copy < haring.json
```
or under Xorg
```bash
jsonnet haring.jsonnet -o haring.json && xclip < haring.json
```

## Setup
```bash
docker swarm init
docker stack deploy -c portainer-agent-stack.yml portainer
```
then deploy the media server stack by copying the contents of `haring.json` to Portainer.
