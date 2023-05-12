local libservice = import 'service.libsonnet';
local Service = libservice.Service;
local WebService = libservice.WebService;
local Http = libservice.http;
local Router = libservice.router;

local data = '${ROOT}/data:/data:rslave';
local hdd = '/mnt/hdd:/data/hdd:rslave';
local blackhole = '${ROOT}/docker/shared/blackhole';
local plex = '${ROOT}/data/media/plex';

{
  version: 3,
  services: std.prune({
    plex: Service('plex', 32400) {
      volumes+: [data],
      environment+: {
        VERSION: 'latest',
      },
      ports: [
        '10000:32400/tcp',
        '3005:3005/tcp',
        '8324:8324/tcp',
        '32469:32469/tcp',
        '1900:1900/udp',
        '32410:32410/udp',
        '32412:32412/udp',
        '32413:32413/udp',
        '32414:32414/udp',
        '10007:33400/tcp',
      ],
    },
    emby: Service('emby', 8096, 0) {
      volumes+: [data],
      ports: ['8096:8096'],
    },
    jellyfin: Service('jellyfin', 8096, 0) {
      volumes+: [data],
    },
    deluge:
      Service('deluge') {
        volumes+: [
          data,
          '%s:/blackhole' % blackhole,
          hdd,
        ],
        ports: [
          '58846:58846',
          '54794:54794',
          '54795:58846',
          '8112:8112',
        ],
        deploy+:
          Http('deluge-daemon', 58846) +
          Http('deluge-web', 8112),
      },
    jackett: Service('jackett', 9117) {
      volumes+: ['%s:/downloads' % blackhole],
      ports: ['10003:9117'],
    },
    sonarr: Service('sonarr', 8989) {
      volumes+: [
        data,
        hdd,
      ],
      ports: ['10001:8989'],
    },
    radarr: Service('radarr', 7878) {
      volumes+: [
        data,
        hdd,
      ],
      ports: ['10002:7878'],
    },
    tautulli: Service('tautulli', 8181, 0),
    kitana: Service('kitana', 31337) {
      image: 'pannal/kitana',
      volumes: ['${ROOT}/docker/kitana:/app/data'],
      command: ['-P'],
    },
    thelounge: Service('thelounge', 9000),
    resilio: Service('resilio', 8888) {
      volumes+: [
        data,
        hdd,
        '${ROOT}/data/resilio/downloads:/downloads',
      ],
      ports: ['55555:55555'],
    },
    overseerr: Service('overseerr', 5055),
    bazarr: Service('bazarr', 6767, 0) {
      volumes+: [
        '%s/TV:/tv' % plex,
        '%s/TV-Anime:/tv-anime' % plex,
        '%s/Movies:/movies' % plex,
        '%s/Movies-Anime:/movies-anime' % plex,
      ],
    },
    shokoserver: Service('shokoserver', 8111, 0) {
      image: 'shokoanime/server',
      volumes+: [
        '%s/TV-Anime:/tv-anime' % plex,
        '%s/Movies-Anime:/movies-anime' % plex,
      ],
      ports: ['8111:8111'],
    },
    speedtest: Service('speedtest', 80) {
      environment+: {
        TITLE: 'Speedtest | Haring',
        TELEMETRY: 'true',
        ENABLE_ID_OBFUSCATION: 'true',
        REDACT_IP_ADDRESSES: 'true',
        PASSWORD: '${SPEEDTEST_PASSWORD}',
        EMAIL: 'hi@bas.sh',
        IPINFO_APIKEY: '${IPINFO_APIKEY}',
      },
    },
    rubytaco: WebService('rubytaco', domain='rubyta.co'),
    bas: WebService('bas', domain='bas.sh'),
    tofuzoom: WebService('tofuzoom', domain='tofuzoom.com'),
    tofumang: WebService('tofumang', domain='tofumang.com'),
    minecraft: Service('tofuzoom-mc', null, 0) {
      image: 'itzg/minecraft-server:adopt14',
      volumes: ['${ROOT}/data/tofuzoom-mc:/data'],
      environment: {
        TYPE: 'PAPER',
        VERSION: 'LATEST',
        EULA: 'true',
        OVERRIDE_SERVER_PROPERTIES: 'true',
        SERVER_NAME: 'tofuZoom',
        DIFFICULTY: 'normal',
        OPS: 'basvdw',
        ICON: 'https://cdn.discordapp.com/emojis/699625083219738654.png',
        ENABLE_RCON: 'true',
        RCON_PASSWORD: '${RCON_PASSWORD}',
        ENABLE_QUERY: 'true',
        MAX_PLAYERS: 420,
        ENABLE_COMMAND_BLOCK: 'true',
        SPAWN_PROTECTION: 0,
        MOTD: ':tofuZoom:',
        MEMORY: '12G',
        USE_AIKAR_FLAGS: 'true',
        USE_LARGE_PAGES: 'true',
        ALLOW_FLIGHT: 'true',
        // ENABLE_AUTOPAUSE: "true",
        // MAX_TICK_TIME: -1,
      },
      ports: [
        '25565:25565',
        '25575:25575',
      ],
      deploy+:
        Http('map.tofuzoom.com', 8123) +
        Http('plan.tofuzoom.com', 8804),
    },
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
                 Router('map.tofuzoom.com', 'http') +
                 Router('plan.tofuzoom.com', 'http') +
                 Router('tofumang.com', 'http'),
      },
    },
  }),
}
