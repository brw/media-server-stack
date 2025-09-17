import docker from "@pulumi/docker";
import { Input, output, Unwrap } from "@pulumi/pulumi";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type MountOpts = docker.types.input.ContainerMount & CustomMountOpts;

type CustomMountOpts = Partial<{
  kind: Input<"directory" | "file">;
}>;

export function _mount({
  source,
  target,
  type = "bind",
  bindOptions,
  readOnly = false,
  kind = "directory",
}: Optional<MountOpts, "target" | "type">): MountOpts {
  if (!source) {
    throw Error("mount does not have source");
  }

  target ??= source;
  bindOptions = output(bindOptions).apply((bindOptions) => ({
    propagation: "rshared",
    ...bindOptions,
  }));

  return {
    source,
    target,
    type,
    bindOptions,
    kind,
    readOnly,
  };
}

type OldMountOpts = Unwrap<
  MountOpts["bindOptions"] &
    CustomMountOpts & { readOnly: MountOpts["readOnly"] }
>;

export const mount = (
  source: MountOpts["source"],
  target?: MountOpts["target"],
  opts?: OldMountOpts,
): MountOpts => {
  const bindOptions = output(opts).apply((opts) =>
    opts?.propagation ? { propagation: opts.propagation } : {},
  );

  return _mount({
    ...opts,
    source,
    target,
    bindOptions,
  });
};

export const gitMount = _mount({ source: "/home/bas/git" });

export const ssdcacheMount = (source: string = "", target?: string) =>
  _mount({ source: `/home/bas/data/ssdcache/${source}`, target });

export const dataMount = (source: string = "", target?: string) =>
  _mount({ source: `/home/bas/data/${source}`, target });

export const confMount = (source: string = "", target?: string) =>
  _mount({ source: `/home/bas/docker/${source}`, target: target ?? "/config" });

export const nvmeMount = (source: string = "", target?: string) =>
  _mount({ source: `/mnt/nvme1/${source}`, target });

export const dockerSocket = _mount({
  source: "/var/run/docker.sock",
  kind: "file",
  readOnly: true,
});

export const resolvConf = _mount({
  source: "/run/systemd/resolve/stub-resolv.conf",
  target: "/etc/resolv.conf",
  kind: "file",
  readOnly: true,
});
