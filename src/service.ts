import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";
import { getEnv } from "./env";

const convertLabels = (labels: Args["labels"]) =>
  labels &&
  Object.entries(labels).map(([label, value]) => ({
    label,
    value,
  }));

const convertPorts = (ports?: Args["ports"]) => {
  return ports?.map((port) => {
    if (typeof port === "number") {
      return {
        internal: port,
        external: port,
      };
    }

    const [internal, external] = port.split(":");
    return {
      internal: parseInt(internal, 10),
      external: parseInt(external, 10),
    };
  });
};

type Registry = "ghcr.io" | "registry.gitlab.com";

const getToken = async (registry: Registry, imageName: string) => {
  let url;

  if (registry === "ghcr.io") {
    url = `https://ghcr.io/token?scope=repository:${imageName}:pull`;
  } else {
    url = `https://gitlab.com/jwt/auth?service=container_registry&scope=repository:${imageName}:pull`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch token for ${imageName}, status: ${response.status}, body: ${await response.text()}`,
    );
  }

  return response.json().then(({ token }) => token);
};

const getLatestImageName = async (image: string) => {
  const match = image.match(
    /^(?:(?<registry>ghcr\.io|registry\.gitlab\.com)\/)?(?<name>(?:(?!:).)+)(?::(?<tag>.+))?/,
  );

  if (!match?.groups) {
    throw new Error(`Failed to parse image: ${image}`);
  }

  const registry = match.groups.registry as Registry;
  const tag = match.groups.tag || "latest";
  const name = match.groups.name;

  let url;
  let headers;

  if (registry) {
    const token = await getToken(registry, name);

    headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.oci.image.index.v1+json",
    };
    url = `https://${registry}/v2/${name}/manifests/${tag}`;
  } else if (name.includes("/")) {
    url = `https://hub.docker.com/v2/repositories/${name}/tags/${tag}`;
  } else {
    url = `https://hub.docker.com/v2/repositories/library/${name}/tags/${tag}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tags for ${image}, status: ${response.status}, body: ${await response.text()}`,
    );
  }

  const tags = await response.json();
  const digest = (tags?.manifests ?? tags?.images)?.find(
    (image: any) =>
      (image.os === "linux" || !image.os) &&
      (image.architecture === "amd64" ||
        image.platform?.architecture === "amd64"),
  )?.digest;

  if (!digest) {
    throw new Error(
      `Failed to find latest digest for ${image}, tags: ${JSON.stringify(tags, null, 2)}`,
    );
  }

  if (registry) {
    return `${registry}/${name}@${digest}`;
  } else {
    return `${name}@${digest}`;
  }
};

type AtLeast<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

type Args = AtLeast<
  {
    image: string;
    subdomain: string;
    hostRule: string;
    webPort: number;
    command: string[];
    middlewares: string[];
    labels: Record<string, string>;
    envs: string[];
    mounts: docker.types.input.ContainerMount[];
    volumes: docker.types.input.ContainerVolume[];
    ports: (`${number}:${number}` | number)[];
    networkMode: pulumi.Input<string>;
    aliases: string[];
    extraContainerOptions: Partial<docker.ContainerArgs>;
  },
  "image"
>;

// const network = new docker.Network("haring", {
//   name: "haring",
//   driver: "bridge",
// });

export class ContainerService extends pulumi.ComponentResource {
  public container: docker.Container;

  public image: docker.RemoteImage;

  static async create(
    name: string,
    args: Partial<Args>,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    const fullArgs: Args = {
      ...args,
      image: await getLatestImageName(args.image || `linuxserver/${name}`),
    };

    return new ContainerService(name, fullArgs, opts);
  }

  constructor(
    name: string,
    args: Args,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("bas:docker:ContainerService", name, args, opts);

    this.image = new docker.RemoteImage(
      `${name}`,
      {
        name: args.image,
        keepLocally: true,
      },
      {
        parent: this,
      },
    );

    let labels = {};
    let host;

    if (args.webPort) {
      host = args.hostRule || `${args.subdomain || name}.bas.sh`;

      labels = {
        "traefik.enable": "true",
        [`traefik.http.services.${name}.loadbalancer.server.port`]:
          args.webPort.toString(),
        [`traefik.http.routers.${name}.rule`]: `Host(\`${host}\`)`,
        [`traefik.http.routers.${name}.entrypoints`]: "https",
        [`traefik.http.routers.${name}.middlewares`]: [
          "cloudflarewarp",
          ...(args.middlewares || []),
        ].join(","),
      };
    }

    labels = {
      ...labels,
      ...args.labels,
    };

    const envs = [
      `PUID=${getEnv("PUID")}`,
      `PGID=${getEnv("PGID")}`,
      `TZ=${getEnv("TZ")}`,
      ...(args.envs || []),
    ];

    this.container = new docker.Container(
      name,
      {
        image: this.image.imageId,
        name,
        command: args.command,
        restart: "always",
        labels: convertLabels(labels),
        envs,
        ports: convertPorts(args.ports),
        mounts: args.mounts,
        volumes: args.volumes,
        networkMode: args.networkMode || "bridge",
        // networksAdvanced: [
        //   {
        //     name: network.name,
        //     ...(args.aliases && {
        //       aliases: args.aliases,
        //     }),
        //   },
        // ],
        ...args.extraContainerOptions,
      },
      {
        parent: this,
        deleteBeforeReplace: true,
        replaceOnChanges: ["mounts", "volumes"],
      },
    );

    this.registerOutputs({
      container: this.container,
      image: this.image,
    });
  }
}
