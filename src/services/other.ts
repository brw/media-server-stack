import * as docker from "@pulumi/docker";
import { ContainerService } from "~lib/service/service";
import {
  dockerSocket,
  confMount,
  mount,
  ssdcacheMount,
  gitMount,
  nvmeMount,
  dataMount,
} from "~lib/service/mounts";
import { interpolate, unsecret } from "@pulumi/pulumi";
import { getEnv } from "~lib/env";
import { haringDockerProvider } from "~lib/service/providers";
import { kaneelnasDockerProvider } from "~lib/service/providers";

const traefikVolume = new docker.Volume(
  "traefik",
  { name: "traefik" },
  {
    retainOnDelete: true,
    provider: haringDockerProvider,
  },
);

const traefikService = new ContainerService("traefik", {
  image: "traefik",
  servicePort: 8080,
  volumes: [
    {
      volumeName: traefikVolume.name,
      containerPath: "/etc/traefik",
    },
  ],
  mounts: [dockerSocket],
  ports: [80, 443, "443/udp"],
  envs: {
    CF_API_EMAIL: getEnv("EMAIL"),
    CF_API_KEY: getEnv("CLOUDFLARE_API_KEY"),
  },
  command: [
    "--api",

    "--providers.docker.exposedbydefault=false",
    "--providers.docker.network=haring",

    "--serverstransport.insecureskipverify",

    "--entrypoints.http.address=[::]:80",
    "--entrypoints.https.address=[::]:443",
    // "--entrypoints.http.address=0.0.0.0:80",
    // "--entrypoints.https.address=0.0.0.0:443",
    "--entrypoints.https.http3",
    "--entrypoints.https.http.tls=true",
    "--entrypoints.https.http.tls.certresolver=cloudflare",
    "--entrypoints.https.http.tls.domains[0].main=bas.sh",
    "--entrypoints.https.http.tls.domains[0].sans=*.bas.sh",

    "--certificatesresolvers.cloudflare.acme.dnschallenge=true",
    "--certificatesresolvers.cloudflare.acme.dnschallenge.provider=cloudflare",
    // "--certificatesresolvers.cloudflare.acme.dnschallenge.resolvers=1.1.1.1:53,8.8.8.8:53",
    "--certificatesresolvers.cloudflare.acme.dnschallenge.resolvers=8.8.8.8:53",
    "--certificatesresolvers.cloudflare.acme.storage=/etc/traefik/acme.json",
    `--certificatesresolvers.cloudflare.acme.email=${getEnv("EMAIL")}`,

    "--experimental.plugins.cloudflare.modulename=github.com/agence-gaya/traefik-plugin-cloudflare",
    "--experimental.plugins.cloudflare.version=v1.2.0",
    "--experimental.plugins.staticresponse.modulename=github.com/jdel/staticresponse",
    "--experimental.plugins.staticresponse.version=v0.0.1",

    "--metrics.prometheus=true",
    "--metrics.prometheus.addEntryPointsLabels=true",
    "--metrics.prometheus.addServicesLabels=true",
    "--metrics.prometheus.addRoutersLabels=true",
    "--metrics.prometheus.buckets=0.1,0.3,1.2,5.0",
    "--metrics.prometheus.manualRouting=true",

    // "--metrics.otlp=true",
    // `--metrics.otlp.address=`,
  ],
  labels: {
    "traefik.http.middlewares.httpsredirect.redirectscheme.scheme": "https",
    "traefik.http.middlewares.httpsredirect.redirectscheme.permanent": "true",

    "traefik.http.middlewares.auth.basicauth.users":
      "bas:$2y$05$XUkzwNnxl2sdNIMqrqspsulGw6fbj1smtwk7bMClLiDIsrR3EatOG",

    "traefik.http.middlewares.cloudflare.plugin.cloudflare.allowedCIDRs":
      "0.0.0.0/0,::/0",
    "traefik.http.middlewares.cloudflare.plugin.cloudflare.refreshInterval":
      "24h",
    "traefik.http.middlewares.cloudflare.plugin.cloudflare.debug": "true",

    "traefik.http.middlewares.teena.plugin.staticresponse.statuscode": "200",
    "traefik.http.middlewares.teena.plugin.staticresponse.body":
      "teena is cute :3",

    "traefik.http.middlewares.mau.plugin.staticresponse.statuscode": "200",
    "traefik.http.middlewares.mau.plugin.staticresponse.body": ":3",

    "traefik.http.middlewares.owo.plugin.staticresponse.statuscode": "200",
    "traefik.http.middlewares.owo.plugin.staticresponse.body": "what's this?",

    "traefik.http.routers.httpsredirect.rule": "HostRegexp(`.+`)",
    "traefik.http.routers.httpsredirect.entrypoints": "http",
    "traefik.http.routers.httpsredirect.middlewares": "httpsredirect",

    "traefik.http.routers.traefik.service": "api@internal",
    "traefik.http.routers.traefik.middlewares": "auth",

    "traefik.http.routers.metrics.service": "prometheus@internal",
    "traefik.http.routers.metrics.rule": "Host(`metrics.bas.sh`)",
    "traefik.http.routers.metrics.entrypoints": "https",
    "traefik.http.routers.metrics.middlewares": "auth",

    "traefik.http.routers.teena.rule":
      "HostRegexp(`^((giga|sigmas?)|gigasigmas?|teena|martyna|a(wa){2,4}|(mi){2,6}|(meow){1,3}).bas.sh$`)",
    "traefik.http.routers.teena.entrypoints": "https",
    "traefik.http.routers.teena.middlewares": "teena",

    "traefik.http.routers.mau.rule":
      "HostRegexp(`^mau(sleeps|craft)?.bas.sh$`)",
    "traefik.http.routers.mau.entrypoints": "https",
    "traefik.http.routers.mau.middlewares": "mau",

    "traefik.http.routers.owo.rule": "HostRegexp(`^owo.bas.sh$`)",
    "traefik.http.routers.owo.entrypoints": "https",
    "traefik.http.routers.owo.middlewares": "owo",
  },
});

const whoamiService = new ContainerService("whoami", {
  image: "traefik/whoami",
  servicePort: 80,
});

const wireguardProtonService = new ContainerService(
  "wireguard-proton",
  {
    image: "lscr.io/linuxserver/wireguard",
    // ports: [32400, "51820/udp"],
    ports: [32400, 32401, "51820/udp", "127.0.0.1:8889:8888"],
    mounts: [confMount("wireguard-proton"), mount("/lib/modules")],
    // envs: ["PEERS=2"],
    privileged: true,
    capabilities: ["NET_ADMIN", "SYS_MODULE"],
    sysctls: { "net.ipv4.conf.all.src_valid_mark": "1" },
    healthcheck: {
      tests: ["CMD", "/usr/bin/curl", "-sS", "icanhazip.com"],
      interval: "20s",
      retries: 3,
      timeout: "10s",
    },
  },
  {
    ignoreChanges: ["ports"],
  },
);

const wireguardMullvadService = new ContainerService(
  "wireguard-mullvad",
  {
    enabled: false,
    image: "lscr.io/linuxserver/wireguard",
    // ports: [8888],
    mounts: [confMount("wireguard-mullvad"), mount("/lib/modules")],
    // envs: ["PEERS=2"],
    privileged: true,
    capabilities: ["NET_ADMIN", "SYS_MODULE"],
    sysctls: { "net.ipv4.conf.all.src_valid_mark": "1" },
    healthcheck: {
      tests: ["CMD", "/usr/bin/curl", "-sS", "icanhazip.com"],
      interval: "20s",
      retries: 3,
      timeout: "10s",
    },
  },
  {
    ignoreChanges: ["ports"],
  },
);

if (wireguardMullvadService.container || wireguardProtonService.container) {
  const tinyproxyService = new ContainerService(
    "tinyproxy",
    {
      image: "kalaksi/tinyproxy",
      envs: {
        LOG_LEVEL: "Info",
        TINYPROXY_UID: 1000,
        TINYPROXY_GID: 1000,
      },
      networkMode: interpolate`container:${(wireguardMullvadService.container ?? wireguardProtonService.container)?.id}`,
    },
    {
      ignoreChanges: ["ports"],
    },
  );
}

if (wireguardProtonService.container) {
  const plexService = new ContainerService(
    "plex",
    {
      servicePort: 32400,
      mounts: [confMount("plex"), ssdcacheMount(), gitMount],
      networkMode: interpolate`container:${wireguardProtonService.container?.id}`,
    },
    {
      ignoreChanges: ["ports"],
    },
  );
}

const syncloungeService = new ContainerService("synclounge", {
  servicePort: 8088,
  envs: {
    AUTH_LIST: "e3b846edd661008e79919a414fdc3b957dad97ac",
  },
});

// const privatePlexService = new ContainerService("plex-private", {
//   image: "lscr.io/linuxserver/plex",
//   servicePort: 32401,
//   mounts: [confMount("plex-private"), dataMount(), gitMount],
//   networkMode: interpolate`container:${wireguardProtonService.container.id}`,
//   envs: {
//     PLEX_CLAIM: "claim-a_r_rc1TpEv5yzCgfy-m",
//   },
// });

// const jellyfinService = new ContainerService("jellyfin", {
//   servicePort: 8096,
//   mounts: [confMount("jellyfin"), dataMount()],
//   envs: {
//     JELLYFIN_PublishedServerUrl: "https://jellyfin.bas.sh",
//   },
// });

// const embyService = new ContainerService("emby", {
//   servicePort: 8096,
//   mounts: [confMount("emby"), dataMount()],
//   envs: {},
// });

const overseerrService = new ContainerService("overseerr", {
  image: "lscr.io/linuxserver/overseerr:develop",
  servicePort: 5055,
  subdomain: "request",
  mounts: [confMount("overseerr"), ssdcacheMount()],
});

const sonarrService = new ContainerService("sonarr", {
  servicePort: 8989,
  image: "lscr.io/linuxserver/sonarr:develop",
  mounts: [confMount("sonarr"), ssdcacheMount()],
});

const radarrService = new ContainerService("radarr", {
  servicePort: 7878,
  mounts: [confMount("radarr"), ssdcacheMount()],
});

const jackettService = new ContainerService("jackett", {
  servicePort: 9117,
  mounts: [confMount("jackett"), ssdcacheMount()],
});

const prowlarrService = new ContainerService("prowlarr", {
  servicePort: 9696,
  mounts: [confMount("prowlarr"), ssdcacheMount()],
});

const kitanaService = new ContainerService("kitana", {
  image: "pannal/kitana",
  servicePort: 31337,
  command: ["-P"],
  volumes: [
    {
      volumeName: "kitana",
      containerPath: "/app/data",
    },
  ],
});

const tautulliService = new ContainerService("tautulli", {
  servicePort: 8181,
  mounts: [
    confMount("tautulli"),
    gitMount,
    confMount(
      "plex/Library/Application Support/Plex Media Server/Logs",
      "/plex-logs",
    ),
  ],
  envs: {
    DOCKER_MODS: "linuxserver/mods:universal-package-install",
    INSTALL_PIP_PACKAGES: "-r /home/bas/git/PlexAniSync/requirements.txt",
  },
});

const qbittorrentService = new ContainerService("qbittorrent", {
  image: "lscr.io/linuxserver/qbittorrent:5.1.2",
  servicePort: 8080,
  // ports: [1337, "1337/udp"],
  envs: {
    // TORRENTING_PORT: 1337,
    DOCKER_MODS: "ghcr.io/vuetorrent/vuetorrent-lsio-mod:latest",
  },
  mounts: [confMount("qbittorrent"), dataMount(), nvmeMount()],
  networkMode: "host",
});

const qbittorrentExporterService = new ContainerService(
  "qbittorrent-exporter",
  {
    image: "caseyscarborough/qbittorrent-exporter",
    servicePort: 17871,
    envs: {
      QBITTORRENT_BASE_URL: qbittorrentService.localUrl ?? "",
      QBITTORRENT_USERNAME: getEnv("USERNAME"),
      QBITTORRENT_PASSWORD: getEnv("QBITTORRENT_PASSWORD"),
    },
  },
);

const qbittoolsService = new ContainerService("qbittools", {
  enabled: true,
  image: "registry.gitlab.com/alexkm/qbittools",
  mounts: [confMount("qbittorrent", "/qbittorrent"), ssdcacheMount()],
  command: [
    "reannounce",
    "-C",
    "/qbittorrent/qBittorrent.conf",
    "-s",
    "https://qbittorrent.bas.sh:443",
    "-U",
    getEnv("USERNAME"),
    "-P",
    getEnv("QBITTORRENT_PASSWORD"),
  ],
});

const librespeedService = new ContainerService("librespeed", {
  enabled: true,
  image: "ghcr.io/librespeed/speedtest",
  servicePort: 8080,
  subdomain: "speedtest",
  otherServicePorts: {
    speed: 8080,
  },
  envs: {
    TITLE: "Speedtest | Bas",
    TELEMETRY: true,
    ENABLE_ID_OBFUSCATION: true,
    REDACT_IP_ADDRESSES: true,
    EMAIL: getEnv("EMAIL"),
    PASSWORD: getEnv("LIBRESPEED_PASSWORD"),
    IPINFO_APIKEY: getEnv("IPINFO_APIKEY"),
  },
});

function caddyfile(subdomain: string) {
  return interpolate`
  http://${subdomain}.bas.sh:80 {
    file_server browse {
    }
    header X-Robots-Tag "noindex"
    basic_auth /plex/* {
      ${getEnv("CADDY_USERNAME")} ${Buffer.from(getEnv("CADDY_PASSWORD")).toString("base64")}
    }
  }
`;
}

["get", "static", "files", "f", "i"].map(async (subdomain) => {
  const caddyFileserverService = new ContainerService(
    `caddy-fileserver-${subdomain}`,
    {
      image: "caddy",
      servicePort: 80,
      subdomain,
      command: [
        "/bin/sh",
        "-c",
        interpolate`echo '${caddyfile(subdomain)}' | caddy run --config - --adapter caddyfile`,
      ],
      mounts: [ssdcacheMount("web/files", "/var/www"), ssdcacheMount()],
      workingDir: "/var/www",
    },
  );
});

const autolanguagesService = new ContainerService("autolanguages", {
  // image: "remirigal/plex-auto-languages",
  image: "journeyover/plex-auto-languages",
  envs: {
    PLEX_TOKEN: getEnv("PLEX_TOKEN"),
    PLEX_URL: "https://plex.bas.sh:443",
    UPDATE_LEVEL: "season",
    TRIGGER_ON_ACTIVITY: true,
    REFRESH_ON_SCAN: true,
    NOTIFICATIONS_ENABLE: true,
    NOTIFICATIONS_APPRISE_CONFIGS: `[{ urls: ["${getEnv("AUTO_LANGUAGES_DISCORD_WEBHOOK")}"], events: ["play_or_activity", "scheduler"] }]`,
  },
});

const theloungeService = new ContainerService("thelounge", {
  servicePort: 9000,
  subdomain: "irc",
  mounts: [confMount("thelounge")],
});

const autobrrService = new ContainerService("autobrr", {
  image: "ghcr.io/autobrr/autobrr",
  servicePort: 7474,
  mounts: [confMount("autobrr")],
});

const ankiService = new ContainerService("anki", {
  image: "ankicommunity/anki-sync-server:latest-develop",
  servicePort: 27701,
  envs: {
    ANKISYNCD_AUTH_DB_PATH: "/app/data/auth.db",
    ANKISYNCD_DATA_ROOT: "/app/data/collections",
    ANKISYNCD_SESSION_DB_PATH: "/app/data/session.db",
  },
  mounts: [confMount("anki", "/app/data")],
});

const sabnzbdService = new ContainerService("sabnzbd", {
  servicePort: 8080,
  mounts: [confMount("sabnzbd"), ssdcacheMount()],
});

const recyclarrService = new ContainerService("recyclarr", {
  image: "recyclarr/recyclarr",
  mounts: [confMount("recyclarr")],
});

const resilioSyncService = new ContainerService("resilio-sync", {
  enabled: true,
  subdomain: "sync",
  servicePort: 8888,
  // ports: [55555, "55555/udp"],
  networkMode: "host",
  mounts: [
    confMount("resilio-sync"),
    ssdcacheMount(),
    ssdcacheMount("sync", "/sync"),
  ],
});

// const syncthingService = new ContainerService("syncthing", {
//   servicePort: 8384,
//   subdomain: "syncthing",
//   ports: [22000, 21027],
//   mounts: [
//     confMount("syncthing"),
//     {
//       source: "/home/bas/data/sync",
//       target: "/sync",
//       type: "bind",
//       bindOptions: {
//         propagation: "rshared",
//       },
//     },
//   ],
// });

const mkvtoolnixService = new ContainerService("mkvtoolnix", {
  image: "jlesage/mkvtoolnix",
  servicePort: 5800,
  mounts: [confMount("mkvtoolnix"), ssdcacheMount()],
  envs: {
    VNC_PASSWORD: getEnv("VNC_PASSWORD"),
    DARK_MODE: true,
    APP_NICENESS: 10,
    KEEP_APP_RUNNING: 1,
    ENABLE_CJK_FONT: 1,
  },
});

const mkvMuxingBatchService = new ContainerService("mkv-batch", {
  image: "jlesage/mkv-muxing-batch-gui",
  servicePort: 5800,
  subdomain: "mkv-batch",
  mounts: [confMount("mkv-batch"), ssdcacheMount()],
  envs: {
    VNC_PASSWORD: getEnv("VNC_PASSWORD"),
    DARK_MODE: true,
    APP_NICENESS: 10,
    KEEP_APP_RUNNING: 1,
    ENABLE_CJK_FONT: 1,
  },
});

// const losslesscutService = new ContainerService("losslesscut", {
//   image: "outlyernet/losslesscut",
//   servicePort: 8080,
//   mounts: [confMount("losslesscut"), dataMount()],
// });

const prometheusService = new ContainerService("prometheus", {
  image: "prom/prometheus",
  servicePort: 9090,
  mounts: [confMount("prometheus", "/etc/prometheus")],
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

const grafanaService = new ContainerService("grafana", {
  image: "grafana/grafana-oss",
  servicePort: 3000,
  mounts: [confMount("grafana", "/var/lib/grafana")],
  envs: {
    GF_INSTALL_PLUGINS: "grafana-piechart-panel",
  },
  user: "1000:1000",
});

// const signozService = new ContainerService("signoz", {
//   image: "signoz/otel-collector",
//   servicePort: 4317,
//   mounts: [
//     confMount("signoz", "/etc/signoz"),
//     mount("/var/lib/signoz", "/var/lib/signoz", { propagation: "rslave" }),
//   ],
// });

const scrutinyService = new ContainerService("scrutiny", {
  image: "ghcr.io/analogj/scrutiny:master-omnibus",
  servicePort: 8080,
  mounts: [
    confMount("scrutiny/config", "/opt/scrutiny/config"),
    confMount("scrutiny/influxdb", "/opt/scrutiny/influxdb"),
    mount("/run/udev", "/run/udev", { readOnly: true }),
  ],
  envs: {
    COLLECTOR_CRON_SCHEDULE: "0 * * * *",
  },
  capabilities: ["SYS_RAWIO", "SYS_ADMIN"],
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
  middlewares: ["auth"],
});

const pixivPublicToPrivateService = new ContainerService(
  "pixiv-public-to-private",
  {
    image: "ghcr.io/tomacheese/pixiv-public-to-private",
    mounts: [confMount("pixiv-public-to-private", "/data")],
  },
);

const jdownloaderService = new ContainerService("jdownloader", {
  enabled: false,
  image: "jlesage/jdownloader-2",
  servicePort: 5800,
  ports: [3129, 5800],
  mounts: [confMount("jdownloader"), ssdcacheMount("downloads", "/output")],
  envs: {
    KEEP_APP_RUNNING: 1,
    DARK_MODE: 1,
    WEB_AUDIO: 1,
    ENABLE_CJK_FONT: 1,
    MYJDOWNLOADER_EMAIL: getEnv("EMAIL"),
    MYJDOWNLOADER_PASSWORD: getEnv("JDOWNLOADER_PASSWORD"),
    MYJDOWNLOADER_DEVICE_NAME: "Haring",
  },
  middlewares: ["auth"],
});

const tailscaleVolume = new docker.Volume(
  "tailscale",
  { name: "tailscale" },
  {
    retainOnDelete: true,
    provider: haringDockerProvider,
  },
);

const tailscaleService = new ContainerService("tailscale", {
  image: "tailscale/tailscale",
  servicePort: 8080,
  volumes: [
    {
      volumeName: tailscaleVolume.name,
      containerPath: "/var/lib/tailscale",
    },
  ],
  mounts: [mount("/lib/modules")],
  envs: {
    TS_ACCEPT_DNS: false,
    TS_AUTHKEY: getEnv("TAILSCALE_AUTH_KEY"),
    TS_HOSTNAME: "haring-docker",
    TS_ENABLE_HEALTH_CHECK: true,
    TS_USERSPACE: true,
    TS_EXTRA_ARGS: "--advertise-exit-node --advertise-tags=tag:container",
    TS_STATE_DIR: "/var/lib/tailscale",
  },
  // networkMode: "host",
  // devices: [{ hostPath: "/dev/net/tun", containerPath: "/dev/net/tun" }],
  capabilities: ["NET_ADMIN", "SYS_MODULE"],
  privileged: true,
});

const bazarrService = new ContainerService("bazarr", {
  enabled: false,
  servicePort: 6767,
  mounts: [confMount("bazarr"), ssdcacheMount()],
});

const netdataService = new ContainerService("netdata", {
  image: "netdata/netdata",
  servicePort: 19999,
  mounts: [
    confMount("netdata/config", "/etc/netdata"),
    confMount("netdata/lib", "/var/lib/netdata"),
    confMount("netdata/cache", "/var/cache/netdata"),
    mount("/", "/host/root", { propagation: "rslave", readOnly: true }),
    mount("/etc/passwd", "/host/etc/passwd", { readOnly: true }),
    mount("/etc/group", "/host/etc/group", { readOnly: true }),
    mount("/etc/localtime", "/host/etc/localtime", { readOnly: true }),
    mount("/proc", "/host/proc", { readOnly: true }),
    mount("/sys", "/host/sys", { readOnly: true }),
    mount("/etc/os-release", "/host/etc/os-release", { readOnly: true }),
    mount("/var/log", "/host/var/log", { readOnly: true }),
    mount("/run/dbus", "/host/run/dbus", { readOnly: true }),
    dockerSocket,
  ],
  capabilities: ["SYS_PTRACE", "SYS_ADMIN"],
  securityOpts: ["apparmor:unconfined"],
  networkMode: "host",
});

const chromiumService = new ContainerService("chromium", {
  enabled: false,
  servicePort: 3000,
  envs: {
    CUSTOM_USER: getEnv("USERNAME"),
    PASSWORD: getEnv("VNC_PASSWORD"),
  },
});

const blueskyService = new ContainerService("bluesky", {
  enabled: false,
  image: "ghcr.io/brw/social-app",
  servicePort: 8100,
  envs: {
    ATP_PDS_HOST: "https://public.api.bsky.app",
  },
  command: ["bskyweb", "serve"],
  middlewares: ["auth"],
});

const beszelSocket = mount("/var/run/beszel_socket", "/beszel_socket");

const beszelService = new ContainerService("beszel", {
  enabled: false,
  image: "henrygd/beszel",
  servicePort: 8090,
  mounts: [confMount("beszel", "/beszel_data"), beszelSocket],
  healthcheck: {
    tests: ["CMD", "/beszel", "health", "--url", "http://localhost:8090"],
    startPeriod: "5s",
    interval: "1m0s",
  },
});

const beszelAgentService = new ContainerService("beszel-agent", {
  enabled: false,
  image: "henrygd/beszel-agent",
  networkMode: "host",
  mounts: [beszelSocket, dockerSocket],
  envs: {
    LISTEN: "/beszel_socket/beszel.sock",
    KEY: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILQa/BKc2uJ0vlog1Cwr2H13Gh3y20eWVL41iwZl+Cyt",
  },
  healthcheck: {
    tests: ["CMD", "/agent", "health"],
    startPeriod: "5s",
    interval: "1m0s",
  },
});

const sist2Service = new ContainerService("sist2", {
  enabled: false,
  image: "sist2app/sist2:x64-linux",
  servicePort: 8080,
  otherServicePorts: { "sist2-web": 4090 },
  mounts: [
    confMount("sist2", "/sist2-admin"),
    ssdcacheMount("content/audios", "/host"),
  ],
  workingDir: "/root/sist2-admin",
  entrypoints: ["python3"],
  command: ["/root/sist2-admin/sist2_admin/app.py"],
  middlewares: ["auth"],
});

if (sist2Service.container) {
  const elasticsearchService = new ContainerService("elasticsearch", {
    image: "elasticsearch:7.17.28",
    ports: ["127.0.0.1:9200:9200", "127.0.0.1:9300:9300"],
    mounts: [confMount("elasticsearch", "/usr/share/elasticsearch/data")],
    envs: { "discovery.type": "single-node" },
  });
}

const maintainerrService = new ContainerService("maintainerr", {
  enabled: false,
  image: "ghcr.io/jorenn92/maintainerr",
  servicePort: 6246,
  mounts: [confMount("maintainerr", "/opt/data")],
  middlewares: ["auth"],
});

const dnsmasqService = new ContainerService("dnsmasq", {
  enabled: false,
  image: "jpillora/dnsmasq",
  ports: ["127.0.0.1:53:5353/udp"],
  mounts: [confMount("dnsmasq", "/etc/")],
  capabilities: ["NET_ADMIN"],
});

const nextCloudService = new ContainerService("nextcloud", {
  servicePort: 443,
  mounts: [
    confMount("nextcloud"),
    confMount("nextcloud-data", "/data"),
    ssdcacheMount("", "/mnt/data"),
  ],
  envs: {
    DOCKER_MODS:
      "linuxserver/mods:nextcloud-notify-push|linuxserver/mods:nextcloud-mediadc",
    DATABASE_URL: interpolate`postgres://postgres:${getEnv("POSTGRES_PASSWORD")}@postgres/nextcloud`,
    DATABASE_PREFIX: "oc_",
    REDIS_URL: interpolate`redis://default:${getEnv("VALKEY_PASSWORD")}@valkey`,
    NEXTCLOUD_URL: "https://nextcloud.bas.sh",
  },
});

const valkeyService = new ContainerService("valkey", {
  image: "valkey/valkey",
  command: [interpolate`--requirepass ${getEnv("VALKEY_PASSWORD")}`],
});

const postgresService = new ContainerService("postgres", {
  image: "postgres",
  mounts: [confMount("postgres", "/var/lib/postgresql/data")],
  envs: {
    POSTGRES_PASSWORD: getEnv("POSTGRES_PASSWORD"),
    POSTGRES_DB: "nextcloud",
  },
});

const stashService = new ContainerService("stash", {
  image: "stashapp/stash",
  servicePort: 9999,
  mounts: [
    confMount("stash", "/root/.stash"),
    ssdcacheMount("", "/data"),
    gitMount,
    mount("/etc/localtime", "/etc/localtime", { readOnly: true }),
  ],
  middlewares: ["auth"],
  cpuShares: 128,
});

const fileStashService = new ContainerService("filestash", {
  image: "machines/filestash",
  servicePort: 8334,
  mounts: [confMount("filestash", "/app/data/state"), ssdcacheMount()],
  envs: {
    APPLICATION_URL: "filestash.bas.sh",
    CANARY: true,
  },
});

const spacedriveService = new ContainerService("spacedrive", {
  enabled: false,
  image: "ghcr.io/spacedriveapp/spacedrive/server",
  servicePort: 8080,
  mounts: [confMount("spacedrive", "/var/spacedrive"), ssdcacheMount()],
  envs: {
    SD_AUTH: interpolate`${getEnv("USERNAME")}:${getEnv("SPACEDRIVE_PASSWORD")}`,
  },
});

const blockheadsService = new ContainerService("blockheads", {
  enabled: false,
  image: "theblockheads/server:development",
  servicePort: 15151,
  ports: [15151, "15151/udp"],
  mounts: [
    confMount("blockheads/config", "/blockheads"),
    confMount(
      "blockheads/worlds",
      "/root/GNUstep/Library/ApplicationSupport/TheBlockheads/saves",
    ),
  ],
  envs: {
    WORLD_NAME: "bmc",
    WORLD_ID: "bmc",
    // WORLD_OWNER: "",
    MAX_PLAYERS: 32,
    SAVE_DELAY: 1,
    WORLD_OWNER: "bas",
    SERVER_PORT: 15151,
  },
});

const glancesService = new ContainerService("glances", {
  enabled: false,
  image: "nicolargo/glances",
  servicePort: 61208,
  ports: [61209],
  mounts: [dockerSocket],
  pidMode: "host",
  envs: {
    GLANCES_OPT: "-w",
  },
  middlewares: ["auth"],
});

const kopiaService = new ContainerService("kopia", {
  enabled: false,
  image: "kopia/kopia",
  servicePort: 51515,
  hostname: "Bas",
  envs: {
    USER: getEnv("USERNAME"),
    KOPIA_PASSWORD: getEnv("KOPIA_PASSWORD"),
  },
  mounts: [
    confMount("kopia", "/app"),
    dataMount("kopia", "/repository"),
    mount("/tmp/kopia", "/tmp"),
    mount("/home/bas/.config/rclone", "/app/rclone"),
  ],
  command: [
    "server",
    "start",
    "--disable-csrf-token-checks",
    "--insecure",
    "--address=0.0.0.0:51515",
    `--server-username=${getEnv("USERNAME")}`,
    interpolate`--server-password=${getEnv("KOPIA_PASSWORD")}`,
  ],
});

const sftpgoService = new ContainerService("sftpgo", {
  image: "drakkan/sftpgo:plugins",
  servicePort: 8080,
  ports: [2022],
  mounts: [
    confMount("sftpgo", "/var/lib/sftpgo"),
    ssdcacheMount("sftpgo", "/srv/sftpgo"),
    ssdcacheMount("", "/srv/data"),
  ],
  envs: {
    SFTPGO_GRACE_TIME: 60,
  },
  stopTimeout: 60,
});

const redroidService = new ContainerService("redroid", {
  enabled: false, // seems to break my entire server's networking setup somehow?
  image: "redroid/redroid:12.0.0_64only-latest",
  privileged: true,
  ports: ["100.93.167.100:5555:5555"],
  mounts: [
    confMount("redroid", "/data"),
    ssdcacheMount("redroid", "/storage/emulated/0/NAS"),
  ],
  command: [
    "androidboot.redroid_width=1080",
    "androidboot.redroid_height=1920",
    "androidboot.redroid_dpi=480",
    "androidboot.use_memfd=true",
    "ro.secure=0",
  ],
  networkMode: "bridge",
});

// TODO: try https://github.com/m1k1o/neko
