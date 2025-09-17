import command from "@pulumi/command";
import type { input } from "@pulumi/command/types";
import docker from "@pulumi/docker";
import type { Input, Output } from "@pulumi/pulumi";
import pulumi, { interpolate } from "@pulumi/pulumi";
import path from "path";
import { network } from "./networks";
import { convertLabels, convertEnvs } from "./util";
import { convertPorts } from "./ports";
import { getEnv } from "~lib/env";
import { haringDockerProvider } from "./providers";
import { MountOpts } from "./mounts";

const defaultConnection: input.remote.ConnectionArgs = {
  host: getEnv("CONNECTION_HOST"),
  user: getEnv("CONNECTION_USER"),
  // password: getEnv("CONNECTION.PASSWORD"),
};

type Env = string | number | boolean;

export type ContainerServiceArgs = Partial<
  Omit<
    docker.ContainerArgs,
    "ports" | "labels" | "mounts" | "envs" | "capabilities"
  > & {
    enabled: boolean;
    disabled: boolean;
    servicePort: number;
    subdomain: string;
    hostRule: string;
    ports: Input<Input<number | string | docker.types.input.ContainerPort>[]>;
    middlewares: string[];
    otherServicePorts: Record<string, number>;
    labels: Record<string, string>;
    mounts: MountOpts[];
    envs: Input<Record<string, Input<Env | Env[]>>>;
    capabilities: string[] | { adds?: string[]; drops?: string[] };
    internalHttps: boolean;
    dontUpdateIf: () => boolean;
    commandConnection: input.remote.ConnectionArgs;
  }
>;

// TODO: turn ContainerService into a factory function like https://sst.dev/docs/examples/#api-gateway-auth
class ContainerService extends pulumi.ComponentResource {
  public readonly container: docker.Container | undefined;
  public readonly localUrl: string | undefined;
  public readonly remoteUrl: string | undefined;
  public readonly ip: Output<string | undefined>;
  public readonly enabled: boolean;
  private readonly commandConnection: input.remote.ConnectionArgs;

  constructor(
    name: string,
    _args: ContainerServiceArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("bas:docker:ContainerService", name, _args, opts);

    const args = {
      enabled: true,
      disabled: false,
      ports: [],
      envs: {},
      mounts: [],
      middlewares: [],
      labels: {},
      otherServicePorts: {},
      networksAdvanced: [],
      hosts: [],
      commandConnection: defaultConnection,
      ..._args,
    } satisfies ContainerServiceArgs;

    this.commandConnection = args.commandConnection;

    const mounts = pulumi.output(args.mounts).apply((mounts) => {
      let i = 0;
      for (const mount of mounts) {
        if (mount.type === "bind" && mount.source && mount.create) {
          const dir =
            mount.kind === "file" ? path.dirname(mount.source) : mount.source;
          this.createRemoteDir(dir, name, i);
          i++;
        }

        delete mount.kind;
        delete mount.create;
      }

      // mounts.push({
      //   type: "bind",
      //   source: "/run/systemd/resolve/stub-resolv.conf",
      //   target: "/etc/resolv.conf",
      //   readOnly: true,
      // });

      return mounts;
    });

    if (!args.enabled || args.disabled) {
      this.enabled = false;
      this.ip = pulumi.output(undefined);
      return;
    }

    const imageManifest = docker.getRegistryImageOutput(
      { name: args.image ?? `lscr.io/linuxserver/${name}` },
      { parent: this },
    );

    const image = new docker.RemoteImage(
      `${name}`,
      {
        name: interpolate`${imageManifest.name}@${imageManifest.sha256Digest}`,
        keepLocally: true,
      },
      { parent: this },
    );

    function createLabels(host: string, port: string) {
      const subdomain = host.replace(".bas.sh", "");
      const id =
        name +
        (subdomain !== args.subdomain && subdomain !== name
          ? "-" + subdomain.replaceAll(/\.|\//g, "-")
          : "");

      return {
        "traefik.enable": "true",
        [`traefik.http.services.${id}.loadbalancer.server.port`]: port,
        [`traefik.http.routers.${id}.service`]: id,
        [`traefik.http.routers.${id}.rule`]: `Host(\`${host}\`)`,
        [`traefik.http.routers.${id}.entrypoints`]: "https",
        [`traefik.http.routers.${id}.middlewares`]: [
          "cloudflare",
          ...args.middlewares,
        ].join(","),
        ...(port === "443" && {
          [`traefik.http.services.${id}.loadbalancer.server.scheme`]: "https",
        }),
      };
    }

    let labels = {};
    if (args.servicePort) {
      this.localUrl = `http://${args.networkMode === "host" ? "host.docker.internal" : name}:${args.servicePort}`;
      const host = args.hostRule ?? `${args.subdomain ?? name}.bas.sh`;
      this.remoteUrl = `https://${host}`;

      labels = {
        ...labels,
        ...createLabels(host, args.servicePort.toString()),
      };
    }

    for (const service of Object.keys(args.otherServicePorts)) {
      let host = service;
      const port = args.otherServicePorts[service];

      if (!host.includes(".bas.sh") && !host.includes("/")) {
        host += ".bas.sh";
      } else if (host.startsWith("/")) {
        host = this.remoteUrl + host;
      }

      labels = {
        ...labels,
        ...createLabels(host, port.toString()),
      };
    }

    labels = {
      ...labels,
      ...args.labels,
    };

    const envs = {
      PUID: `${getEnv("PUID")}`,
      PGID: `${getEnv("PGID")}`,
      TZ: `${getEnv("TZ")}`,
      ...args.envs,
    };

    const ports = convertPorts(args.ports);

    // pulumi.output(ports).apply((ports) => {
    //   if (name === "minecraft-akio") console.dir(ports, { depth: null });
    // });

    const capabilities = Array.isArray(args.capabilities)
      ? { adds: args.capabilities }
      : args.capabilities;

    const ensureCapPrefix = (cap: string) =>
      cap.startsWith("CAP_") ? cap : `CAP_${cap}`;

    if (capabilities) {
      capabilities.adds &&= capabilities.adds.map(ensureCapPrefix);
      capabilities.drops &&= capabilities.drops.map(ensureCapPrefix);
    }

    this.container = new docker.Container(
      name,
      {
        ...args,
        image: image.imageId,
        name: args.name ?? name,
        command: args.command,
        restart: "always",
        labels: convertLabels(labels),
        envs: convertEnvs(envs),
        ports,
        mounts,
        volumes: args.volumes,
        networkMode: args.networkMode ?? "bridge",
        // TODO: healthchecks
        // healthcheck: {tests}
        networksAdvanced: args.networkMode
          ? []
          : pulumi
              .output(args.networksAdvanced)
              .apply((networksAdvanced) => [
                ...networksAdvanced,
                { name: network.name },
              ]),
        hosts: args.networkMode
          ? []
          : pulumi
              .output(args.hosts)
              .apply((hosts) => [
                { host: "host.docker.internal", ip: "host-gateway" },
                ...hosts,
              ]),
        capabilities,
      },
      {
        parent: this,
        deleteBeforeReplace: true,
        replaceOnChanges: ["mounts", "volumes"],
        ignoreChanges: opts?.ignoreChanges,
        ...opts,
      },
    );

    this.ip = pulumi
      .all([this.container.networkDatas, network.name])
      .apply(([networks, networkName]) => {
        const net = networks?.find((n) => n.networkName === networkName);
        return net?.ipAddress;
      });

    this.enabled = true;

    this.registerOutputs();
  }

  private createRemoteDir(path: string, name: string, index: number) {
    new command.remote.Command(
      `mkdir-${name}-${index}`,
      {
        connection: this.commandConnection,
        create: `test -e "${path}" || mkdir -p "${path}"`,
        delete: path.includes("/")
          ? path
              .split("/")
              .slice(1)
              .map(
                (_segment, i, segments) =>
                  `rmdir "/${segments.slice(0, segments.length - i).join("/")}"`,
              )
              .join(" && ") + " || true"
          : undefined,
      },
      {
        parent: this,
        deleteBeforeReplace: true,
        ignoreChanges: ["connection"],
      },
    );
  }

  static async remoteRun(
    args: command.local.RunArgs,
    opts?: pulumi.InvokeOptions,
  ): Promise<command.local.RunResult> {
    const newArgs: command.local.RunArgs = {
      ...args,
      interpreter: ["/usr/bin/ssh", getEnv("CONNECTION_HOST")],
    };

    return command.local.run(newArgs, {
      ...opts,
    });
  }
}

class ContainerServiceWrapper extends ContainerService {
  constructor(...args: ConstructorParameters<typeof ContainerService>) {
    args[2] = {
      provider: haringDockerProvider,
      ...args[2],
    };

    super(...args);
  }
}

export { ContainerServiceWrapper as ContainerService };
