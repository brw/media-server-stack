import docker from "@pulumi/docker";

export const haringDockerProvider = new docker.Provider("haring", {
  host: "ssh://haring",
  context: "haring",
});

export const kaneelnasDockerProvider = new docker.Provider("kaneelnas", {
  host: "ssh://kaneelnas",
  context: "kaneelnas",
});
