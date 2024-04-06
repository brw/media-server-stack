# Media Server

My single node media server. Used to be Docker Swarm (in the jsonnet folder), now just Docker containers orchestrated using Pulumi.

# Setup

First change the required variables in .env, then

```bash
bun install
pulumi up
```
