import { getEnv } from "~lib/env";
import { mount } from "~lib/service/mounts";
import { kaneelnasDockerProvider } from "~lib/service/providers";
import { ContainerService } from "~lib/service/service";

const KANEELNAS_DOCKER = "/volume1/docker/bas";
const KANEELNAS_DATA = "/volume1/data/bas";
const KANEELNAS_HOST = getEnv("KANEELNAS_HOST");

const kaneelnasConnection = {
  host: KANEELNAS_HOST,
  user: getEnv("USERNAME"),
};

const kaneelnasQbittorrentService = new ContainerService(
  "qbittorrent-kaneelnas",
  {
    image: "lscr.io/linuxserver/qbittorrent:5.1.2",
    name: "qbittorrent-bas",
    // servicePort: 8080,
    // ports: [8450, 8451, "8451/udp"],
    envs: {
      WEBUI_PORT: 8450,
      TORRENTING_PORT: 8451,
      DOCKER_MODS: "ghcr.io/vuetorrent/vuetorrent-lsio-mod:latest",
      PUID: 1027,
      PGID: 100,
    },
    mounts: [
      mount(`${KANEELNAS_DOCKER}/qbittorrent`, "/config", {
        propagation: "private",
      }),
      mount(`${KANEELNAS_DATA}/torrents-kaneelnas`, "/downloads", {
        propagation: "private",
      }),
      mount(`${KANEELNAS_DATA}/plex`, "/plex", {
        propagation: "private",
      }),
    ],
    networkMode: "host",
    commandConnection: kaneelnasConnection,
    destroyGraceSeconds: 60,
  },
  {
    provider: kaneelnasDockerProvider,
    ignoreChanges: ["ports"],
  },
);

const kaneelnasWhoamiService = new ContainerService(
  "whoami-kaneelnas",
  {
    name: "whoami-bas",
    image: "ghcr.io/traefik/whoami",
    // servicePort: 80,
    ports: ["8452:80"],
    networkMode: "bridge",
    commandConnection: kaneelnasConnection,
  },
  {
    provider: kaneelnasDockerProvider,
    ignoreChanges: ["ports"],
  },
);
