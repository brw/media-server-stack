# Media Server Stack

The Pulumi code I use for my single node container-based media server (among other things). Used to be Docker Swarm, generating my Docker Compose file with Jsonnet (my old setup can be found in the [jsonnet](./.old/jsonnet) folder), but I have since switched to orchestrating Docker containers with Pulumi.

# Setup

```bash
bun install
pulumi up
```
