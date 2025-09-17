import docker from "@pulumi/docker";
import { haringDockerProvider } from "./providers";

export const network = new docker.Network(
  "haring",
  {
    name: "haring",
    driver: "bridge",
    options: {
      // "com.docker.network.bridge.gateway_mode_ipv6": "routed",
      "com.docker.network.bridge.host_binding_ipv4": "0.0.0.0",
      // "com.docker.network.driver.mtu": "1468",
    },
    ipv6: true,
    ipamConfigs: [
      {
        gateway: "2001:db8::1",
        subnet: "2001:db8::/64",
      },
      {
        auxAddress: {},
        gateway: "172.18.0.1",
        ipRange: "",
        subnet: "172.18.0.0/16",
      },
    ],
  },
  { provider: haringDockerProvider },
);
