import { getEnv } from "~lib/env";
import { ContainerService } from "~lib/service/service";

const rconService = new ContainerService("rcon", {
  image: "itzg/rcon",
  servicePort: 4326,
  otherServicePorts: {
    "ws.rcon": 4327,
  },
  envs: {
    RWA_USERNAME: "bas",
    RWA_PASSWORD: getEnv("RCON_PASSWORD"),
    RWA_ADMIN: true,
    RWA_RCON_HOST: "minecraft-akio",
    RWA_RCON_PASSWORD: getEnv("RCON_PASSWORD"),
    RWA_WEBSOCKET_URL: "ws://ws.rcon.bas.sh",
    RWA_WEBSOCKET_URL_SSL: "wss://ws.rcon.bas.sh",
  },
});
