local libservice = import 'service.libsonnet';
local Service = libservice.Service;
local WebService = libservice.WebService;
local Http = libservice.http;
local Router = libservice.router;

local data = '${ROOT}/data:/home/bas/data:rslave';
local git = '/home/bas/git:/home/bas/git';

{
  version: '3.8',
  services: std.prune({
    whoami: Service('whoami', 80) {
      image: 'traefik/whoami',
      volumes: [],
    },
    plex: Service('plex', 32400) {
      volumes+: [data, git],
      environment+: {
        VERSION: 'latest',
      },
      ports: [
        '32400:32400/tcp',
        '3005:3005/tcp',
        '8324:8324/tcp',
        '32469:32469/tcp',
        '1900:1900/udp',
        '32410:32410/udp',
        '32412:32412/udp',
        '32413:32413/udp',
        '32414:32414/udp',
        '33400:33400/tcp',
      ],
    },

    jackett: Service('jackett', 9117),

    sonarr: Service('sonarr', 8989) {
      volumes+: [data],
    },

    radarr: Service('radarr', 7878) {
      volumes+: [data],
    },

    autobrr: Service('autobrr', 7474) {
      image: 'ghcr.io/autobrr/autobrr',
    },

    tautulli: Service('tautulli', 8181) {
      volumes+: [data, git],
    },

    sabnzbd: Service('sabnzbd', 8080) {
      volumes+: [data],
    },

    anki: Service('anki', 27701) {
      image: 'ankicommunity/anki-sync-server:latest-develop',
      volumes: [
        '${ROOT}/docker/anki:/app/data',
      ],
      environment+: {
        ANKISYNCD_DATA_ROOT: '/app/data/collections',
        ANKISYNCD_AUTH_DB_PATH: '/app/data/auth.db',
        ANKISYNCD_SESSION_DB_PATH: '/app/data/session.db',
      },
    },

    gitea: Service('gitea', 3000, replicas=0) {
      image: 'gitea/gitea',
      volumes: [
        '${ROOT}/docker/gitea:/data',
        '/etc/timezone:/etc/timezone:ro',
        '/etc/localtime:/etc/localtime:ro',
      ],
      ports: [
        '2222:22',
        '3000:3000',
      ],
    },

    kitana: Service('kitana', 31337) {
      image: 'pannal/kitana',
      volumes: [
        '${ROOT}/docker/kitana:/app/data',
      ],
      command: [
        '-P',
      ],
    },

    autolanguages: Service('autolanguages') {
      image: 'remirigal/plex-auto-languages',
      environment+: {
        PLEX_URL: '${PLEX_URL}',
        PLEX_TOKEN: '${PLEX_TOKEN}',
        UPDATE_LEVEL: 'season',
        TRIGGER_ON_ACTIVITY: 'true',
        //REFRESH_LIBRARY_ON_SCAN: 'false',
        NOTIFICATIONS_ENABLE: 'true',
        NOTIFICATIONS_APPRISE_CONFIGS:
          '[{ urls: ["${DISCORD_AUTO_LANGUAGES_WEBHOOK_URL}"], events: ["play_or_activity", "scheduler"] }]',
      },
    },

    thelounge: Service('thelounge', 9000, domain='irc'),

    resilio: Service('resilio', 8888, domain='sync', replicas=0) {
      image: 'ghcr.io/linuxserver/resilio-sync',
      volumes+: [
        data,
        '${ROOT}/data/resilio/downloads:/downloads',
      ],
      ports: [
        '55555:55555',
      ],
    },

    overseerr: Service('overseerr', 5055, domain='request'),

    monero: Service('monero', 28081) {
      image: 'rinocommunity/monero',
      volumes: [
        '${ROOT}/docker/monero:/monero',
      ],
      environment+: {
        RPC_USER: 'bas',
        RPC_PASSWD: '${PASSWORD}',
      },
      ports: [
        '28080:28080',
        '28081:28081',
      ],
      command: [
        '--data-dir /monero',
      ],
    },

    wizarr: Service('wizarr', 5690, domain='join') {
      image: 'ghcr.io/wizarrrr/wizarr',
      volumes: [
        '${ROOT}/docker/wizarr:/data/database',
      ],
      environment+: {
        APP_URL: 'https://join.bas.sh',
        ALLOW_BUG_REPORTING: 'true',
      },
    },

    librespeed: Service('librespeed', 80, domain='speedtest') {
      environment+: {
        TITLE: 'Speedtest | Bas',
        TELEMETRY: 'true',
        ENABLE_ID_OBFUSCATION: 'true',
        REDACT_IP_ADDRESSES: 'true',
        PASSWORD: '${PASSWORD}',
        EMAIL: 'hi@bas.sh',
        IPINFO_APIKEY: '${IPINFO_APIKEY}',
      },
    },

    files: Service('files', 8000) {
      image: 'codeskyblue/gohttpserver',
      volumes: [
        '${ROOT}/data/web/files:/app/public',
      ],
      deploy+: {
        labels+: Router('get'),
      },
    },

    static: Service('static', 8080) {
      image: 'halverneus/static-file-server',
      volumes: [
        '${ROOT}/data/web/files:/web',
      ],
      environment+: {
        CORS: 'true',
      },
    },

    rubytaco: WebService('rubytaco', domain='rubyta.co'),

    bas: WebService('bas', domain='bas.sh'),

    tofumang: WebService('tofumang', domain='tofumang.com'),

    traefik: Service('traefik', 8080) {
      image: 'traefik',
      volumes: [
        '/var/run/docker.sock:/var/run/docker.sock:ro',
        '${ROOT}/docker/traefik:/etc/traefik',
      ],
      ports: [
        {
          target: 80,
          published: 80,
          protocol: 'tcp',
          mode: 'host',
        },
        {
          target: 443,
          published: 443,
          protocol: 'tcp',
          mode: 'host',
        },
        {
          target: 69,
          published: 69,
          protocol: 'tcp',
          mode: 'host',
        },
      ],
      environment+: {
        CF_API_EMAIL: 'hi@bas.sh',
        CF_API_KEY: '${CF_API_KEY}',
      },
      command: [
        '--api.insecure=true',
        '--providers.docker.endpoint=unix:///var/run/docker.sock',
        '--providers.docker.swarmmode=true',
        '--providers.docker.exposedbydefault=false',
        '--entrypoints.http.address=:80',
        '--entrypoints.https.address=:443',
        '--certificatesresolvers.cloudflare.acme.dnschallenge=true',
        '--certificatesresolvers.cloudflare.acme.dnschallenge.provider=cloudflare',
        '--certificatesresolvers.cloudflare.acme.dnschallenge.resolvers=1.1.1.1:53,8.8.8.8:53',
        '--certificatesresolvers.cloudflare.acme.storage=/etc/traefik/acme.json',
        '--certificatesresolvers.cloudflare.acme.email=hi@bas.sh',
      ],
      deploy+: {
        labels+: {
                   'traefik.http.routers.traefik.service': 'api@internal',
                   'traefik.http.routers.traefik.tls.domains[0].main': 'bas.sh',
                   'traefik.http.routers.traefik.tls.domains[0].sans': '*.bas.sh',
                   'traefik.http.middlewares.httpsredirect.redirectscheme.scheme': 'https',
                 } +
                 Router('http', 'http', 'HostRegexp(`{subdomain:[a-z0-9\\-]+}.bas.sh`)') +
                 Router('rubyta.co', 'http') +
                 Router('bas.sh', 'http') +
                 Router('tofuzoom.com', 'http') +
                 Router('tofumang.com', 'http'),
      },
    },
  }),
}
