local hasTld(domain) =
  std.length(std.findSubstr('.', domain)) != 0;

local base(domain) =
  if hasTld(domain) then
    local split = std.split(domain, '.');
    std.join('-', std.slice(split, 0, std.length(split) - 1, 1))
  else domain;

{
  http(domain, port, entrypoint='https'):: {
    'traefik.enable': 'true',
    'traefik.docker.network': 'traefik',
    ['traefik.http.services.%s.loadbalancer.server.port' % base(domain)]: port,
  } + $.router(domain, entrypoint),
  router(domain, entrypoint='https', rule=null):: {
    ['traefik.http.routers.%s%s.entrypoints' % [if entrypoint != 'https' then entrypoint else '', base(domain)]]: entrypoint,
    ['traefik.http.routers.%s%s.rule' % [if entrypoint != 'https' then entrypoint else '', base(domain)]]:
      if rule != null then
        rule
      else if hasTld(domain) then
        'Host(`%s`)' % domain
      else
        'Host(`%s.bas.sh`)' % domain,
    [if entrypoint == 'https' then 'traefik.http.routers.%s%s.tls.certresolver' % [
      if entrypoint != 'https' then entrypoint else '',
      base(domain),
    ]]: 'cloudflare',
    [if entrypoint == 'http' then 'traefik.http.routers.%s%s.middlewares' % [
      if entrypoint != 'https' then entrypoint else '',
      base(domain),
    ]]: 'httpsredirect',
  },
  Service(name, port=null, replicas=null, domain=name):: {
    image: 'ghcr.io/linuxserver/' + name,
    hostname: 'Haring',
    volumes: [
      '${ROOT}/docker/%s:/config' % name,
    ],
    environment: {
      PUID: '${UID}',
      GUID: '${GID}',
      TZ: '${TZ}',
    },
    ports: [],
    deploy+: {
      [if replicas != null then 'replicas']: replicas,
      [if port != null then 'labels']+: $.http(domain, port),
    },
  },
  WebService(name, port=80, replicas=null, domain):: $.Service(name, port, replicas, domain) {
    image: 'ghcr.io/linuxserver/nginx',
    volumes+: ['${ROOT}/data/web/%s:/config/www' % name],
  },
}
