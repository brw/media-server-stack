import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { remote } from "@pulumi/command";
import { ContainerService } from "./service";
import { getEnv } from "./env";

const dockerConfMount = (name: string, target?: string) => {
  new remote.Command(`mkdir-${name}`, {
    connection: { host: "haring.bas.sh", user: "bas" },
    create: `mkdir -p /home/bas/docker/${name}`,
  });

  return {
    source: `/home/bas/docker/${name}`,
    target: target || "/config",
    type: "bind",
  };
};

const dataMount = {
  source: "/home/bas/data",
  target: "/home/bas/data",
  type: "bind",
  bindOptions: {
    propagation: "rshared",
  },
};

const gitMount = {
  target: "/home/bas/git",
  source: "/home/bas/git",
  type: "bind",
};

const traefikVolume = new docker.Volume("traefik", {
  name: "traefik",
});

const traefikService = await ContainerService.create("traefik", {
  image: "traefik",
  webPort: 8080,
  volumes: [
    {
      volumeName: traefikVolume.name,
      containerPath: "/etc/traefik",
    },
  ],
  mounts: [
    {
      source: "/var/run/docker.sock",
      target: "/var/run/docker.sock",
      type: "bind",
      readOnly: true,
    },
  ],
  ports: [80, 443],
  envs: [
    `CF_API_EMAIL=${getEnv("EMAIL")}`,
    `CF_API_KEY=${getEnv("CF_API_KEY")}`,
  ],
  command: [
    "--api",
    "--providers.docker.endpoint=unix:///var/run/docker.sock",
    "--providers.docker.exposedbydefault=false",
    "--entrypoints.http.address=:80",
    "--entrypoints.https.address=:443",
    "--entrypoints.https.http.tls=true",
    "--entrypoints.https.http.tls.certresolver=cloudflare",
    "--entrypoints.https.http.tls.domains[0].main=bas.sh",
    "--entrypoints.https.http.tls.domains[0].sans=*.bas.sh",
    "--certificatesresolvers.cloudflare.acme.dnschallenge=true",
    "--certificatesresolvers.cloudflare.acme.dnschallenge.provider=cloudflare",
    "--certificatesresolvers.cloudflare.acme.dnschallenge.resolvers=1.1.1.1:53,8.8.8.8:53",
    "--certificatesresolvers.cloudflare.acme.storage=/etc/traefik/acme.json",
    `--certificatesresolvers.cloudflare.acme.email=${getEnv("EMAIL")}`,
    "--experimental.plugins.cloudflarewarp.modulename=github.com/BetterCorp/cloudflarewarp",
    "--experimental.plugins.cloudflarewarp.version=v1.3.3",
    "--metrics.prometheus=true",
    "--metrics.prometheus.addEntryPointsLabels=true",
    "--metrics.prometheus.addServicesLabels=true",
    "--metrics.prometheus.addRoutersLabels=true",
    "--metrics.prometheus.buckets=0.1,0.3,1.2,5.0",
    "--metrics.prometheus.manualRouting=true",
  ],
  labels: {
    "traefik.http.middlewares.httpsredirect.redirectscheme.scheme": "https",
    "traefik.http.middlewares.cloudflarewarp.plugin.cloudflarewarp.disableDefault":
      "false",
    "traefik.http.middlewares.auth.basicauth.users":
      "bas:$2y$05$XUkzwNnxl2sdNIMqrqspsulGw6fbj1smtwk7bMClLiDIsrR3EatOG",
    "traefik.http.routers.httpsredirect.entrypoints": "http",
    "traefik.http.routers.httpsredirect.middlewares": "httpsredirect",
    "traefik.http.routers.httpsredirect.rule": "HostRegexp(`{any:.+}`)",

    "traefik.http.routers.traefik.service": "api@internal",
    "traefik.http.routers.traefik.middlewares": "auth",

    "traefik.http.routers.metrics.service": "prometheus@internal",
    "traefik.http.routers.metrics.rule": "Host(`metrics.bas.sh`)",
    "traefik.http.routers.metrics.entrypoints": "https",
    "traefik.http.routers.metrics.middlewares": "auth",
  },
});

const whoamiService = await ContainerService.create("whoami", {
  image: "traefik/whoami",
  webPort: 80,
});

const wireguardService = await ContainerService.create("wireguard", {
  ports: [32400],
  mounts: [
    dockerConfMount("wireguard"),
    {
      source: "/lib/modules",
      target: "/lib/modules",
      type: "bind",
    },
  ],
  extraContainerOptions: {
    privileged: true,
    capabilities: {
      adds: ["NET_ADMIN", "SYS_MODULE"],
    },
    sysctls: { "net.ipv4.conf.all.src_valid_mark": 1 },
  },
});

const plexService = await ContainerService.create("plex", {
  webPort: 32400,
  envs: ["VERSION=latest"],
  mounts: [dockerConfMount("plex"), dataMount, gitMount],
  extraContainerOptions: {
    networkMode: pulumi.interpolate`container:${wireguardService.container.id}`,
  },
});

const overseerrService = await ContainerService.create("overseerr", {
  webPort: 5055,
  domain: "request",
  mounts: [dockerConfMount("overseerr"), dataMount],
});

const sonarrService = await ContainerService.create("sonarr", {
  webPort: 8989,
  mounts: [dockerConfMount("sonarr"), dataMount],
});

const radarrService = await ContainerService.create("radarr", {
  webPort: 7878,
  mounts: [dockerConfMount("radarr"), dataMount],
});

const jackettService = await ContainerService.create("jackett", {
  webPort: 9117,
  ports: [9117],
  mounts: [dockerConfMount("jackett"), dataMount],
});

const kitanaService = await ContainerService.create("kitana", {
  image: "pannal/kitana",
  webPort: 31337,
  mounts: [
    {
      source: "kitana",
      target: "/app/data",
      type: "volume",
    },
  ],
});

const tautulliService = await ContainerService.create("tautulli", {
  webPort: 8181,
  mounts: [dockerConfMount("tautulli"), gitMount],
  envs: [
    "DOCKER_MODS=linuxserver/mods:universal-package-install",
    "INSTALL_PIP_PACKAGES=-r /home/bas/git/PlexAniSync/requirements.txt",
  ],
});

const qbittorrentService = await ContainerService.create("qbittorrent", {
  webPort: 8080,
  ports: [1337],
  envs: ["TORRENTING_PORT=1337"],
  mounts: [dockerConfMount("qbittorrent"), dataMount],
});

const librespeedService = await ContainerService.create("librespeed", {
  image: "ghcr.io/librespeed/speedtest",
  webPort: 80,
  domain: "speedtest",
  envs: [
    "TITLE=Speedtest | Bas",
    "TELEMETRY=true",
    "ENABLE_ID_OBFUSCATION=true",
    "REDACT_IP_ADDRESSES=true",
    `EMAIL=${getEnv("EMAIL")}`,
    `PASSWORD=${getEnv("LIBRESPEED_PASSWORD")}`,
    `IPINFO_APIKEY=${getEnv("IPINFO_APIKEY")}`,
  ],
});

["get", "static", "files", "f", "i"].map(async (subdomain) => {
  await ContainerService.create(`caddy${subdomain}`, {
    image: "caddy",
    webPort: 80,
    domain: subdomain,
    command: [
      "caddy",
      "file-server",
      "--browse",
      "--root=/var/www",
      `--domain=${subdomain}.bas.sh`,
      "--listen=:80",
    ],
    mounts: [
      {
        source: "/home/bas/data/media/web/files",
        target: "/var/www",
        type: "bind",
        bindOptions: {
          propagation: "rshared",
        },
      },
    ],
  });
});

const autolanguagesService = await ContainerService.create("autolanguages", {
  image: "remirigal/plex-auto-languages",
  envs: [
    `PLEX_TOKEN=${getEnv("PLEX_TOKEN")}`,
    "PLEX_URL=https://plex.bas.sh:443",
    "UPDATE_LEVEL=season",
    "TRIGGER_ON_ACTIVITY=true",
    "REFRESH_ON_SCAN=true",
    "NOTIFICATIONS_ENABLE=true",
    `NOTIFICATIONS_APPRISE_CONFIGS=[{ urls: ["${getEnv("DISCORD_AUTO_LANGUAGES_WEBHOOK")}"], events: ["play_or_activity", "scheduler"] }]`,
  ],
});

const theloungeService = await ContainerService.create("thelounge", {
  webPort: 9000,
  domain: "irc",
  mounts: [dockerConfMount("thelounge")],
});

const autobrrService = await ContainerService.create("autobrr", {
  image: "ghcr.io/autobrr/autobrr",
  webPort: 7474,
  mounts: [dockerConfMount("autobrr")],
});

const ankiService = await ContainerService.create("anki", {
  image: "ankicommunity/anki-sync-server:latest-develop",
  webPort: 27701,
  envs: [
    "ANKISYNCD_AUTH_DB_PATH=/app/data/auth.db",
    "ANKISYNCD_DATA_ROOT=/app/data/collections",
    "ANKISYNCD_SESSION_DB_PATH=/app/data/session.db",
  ],
  mounts: [dockerConfMount("anki", "/app/data")],
});

const sabnzbdService = await ContainerService.create("sabnzbd", {
  webPort: 8080,
  mounts: [dockerConfMount("sabnzbd"), dataMount],
});

const recyclarrService = await ContainerService.create("recyclarr", {
  image: "recyclarr/recyclarr",
  mounts: [dockerConfMount("recyclarr")],
});

const qbittoolsService = await ContainerService.create("qbittools", {
  image: "registry.gitlab.com/alexkm/qbittools",
  mounts: [
    {
      source: "/home/bas/docker/qbittorrent",
      target: "/qbittorrent",
      type: "bind",
    },
    dataMount,
  ],
  command: [
    "reannounce",
    "-C",
    "/qbittorrent/qBittorrent.conf",
    "-s",
    "https://qbittorrent.bas.sh:443",
    "-U",
    getEnv("QBITTORRENT_USERNAME"),
    "-P",
    getEnv("QBITTORRENT_PASSWORD"),
  ],
});

const resilioSyncService = await ContainerService.create("resilio-sync", {
  domain: "sync",
  webPort: 8888,
  ports: [55555],
  mounts: [
    dockerConfMount("resilio-sync"),
    {
      source: "/home/bas/data/media/sync",
      target: "/sync",
      type: "bind",
      bindOptions: {
        propagation: "rshared",
      },
    },
  ],
});

const syncthingService = await ContainerService.create("syncthing", {
  webPort: 8384,
  domain: "syncthing",
  ports: [22000, 21027],
  mounts: [
    dockerConfMount("syncthing"),
    {
      source: "/home/bas/data/media/sync",
      target: "/sync",
      type: "bind",
      bindOptions: {
        propagation: "rshared",
      },
    },
  ],
});

const mkvtoolnixService = await ContainerService.create("mkvtoolnix", {
  image: "jlesage/mkv-muxing-batch-gui",
  webPort: 5800,
  mounts: [dockerConfMount("mkvtoolnix"), dataMount],
  envs: [
    `VNC_PASSWORD=${getEnv("MKVTOOLNIX_VNC_PASSWORD")}`,
    "DARK_MODE=true",
    "APP_NICENESS=10",
    "KEEP_APP_RUNNING=1",
    "ENABLE_CJK_FONT=1",
  ],
});

const prometheusService = await ContainerService.create("prometheus", {
  image: "prom/prometheus",
  webPort: 9090,
  mounts: [dockerConfMount("prometheus", "/etc/prometheus")],
  volumes: [
    {
      volumeName: "prometheus",
      containerPath: "/prometheus",
    },
  ],
  command: [
    "--config.file=/etc/prometheus/prometheus.yml",
    "--storage.tsdb.path=/prometheus",
    "--web.console.libraries=/etc/prometheus/console_libraries",
    "--web.console.templates=/etc/prometheus/consoles",
  ],
  middlewares: ["auth"],
});

const grafanaService = await ContainerService.create("grafana", {
  image: "grafana/grafana-oss",
  webPort: 3000,
  mounts: [dockerConfMount("grafana", "/var/lib/grafana")],
  envs: ["GF_INSTALL_PLUGINS=grafana-piechart-panel"],
  extraContainerOptions: {
    user: "1000:1000",
  },
});

const scrutinyService = await ContainerService.create("scrutiny", {
  image: "ghcr.io/analogj/scrutiny:master-omnibus",
  webPort: 8080,
  mounts: [
    dockerConfMount("scrutiny/config", "/opt/scrutiny/config"),
    dockerConfMount("scrutiny/influxdb", "/opt/scrutiny/influxdb"),
    {
      source: "/run/udev",
      target: "/run/udev",
      type: "bind",
      readOnly: true,
    },
  ],
  extraContainerOptions: {
    capabilities: {
      adds: ["SYS_RAWIO", "SYS_ADMIN"],
    },
    devices: [
      "sda",
      "sdb",
      "sdc",
      "sdd",
      "sde",
      "sdf",
      "sdg",
      "sdh",
      "sdi",
      "sdj",
      "nvme0",
      "nvme1",
    ].map((i) => ({
      containerPath: `/dev/${i}`,
      hostPath: `/dev/${i}`,
      permissions: "r",
    })),
  },
  middlewares: ["auth"],
});
