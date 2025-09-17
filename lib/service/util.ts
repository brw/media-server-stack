import { ContainerServiceArgs } from "./service";
import { output } from "@pulumi/pulumi";

export function convertLabels(
  labels: NonNullable<ContainerServiceArgs["labels"]>,
) {
  return Object.entries(labels).map(([label, value]) => ({ label, value }));
}

export function convertEnvs(envs: ContainerServiceArgs["envs"]) {
  return output(envs).apply((envs) => {
    return Object.entries(envs ?? {}).map(
      ([env, value]) =>
        `${env}=${Array.isArray(value) ? value.join("\n") : value}`,
    );
  });
}
