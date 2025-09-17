import { output } from "@pulumi/pulumi";
import { ContainerServiceArgs } from "./service";

function parsePort(input: string | number, localOnly: boolean = false) {
  input = String(input);

  const slashIdx = input.lastIndexOf("/");
  let protocol: "tcp" | "udp" = "tcp";
  if (slashIdx !== -1) {
    const proto = input.slice(slashIdx + 1);
    protocol = proto === "udp" ? "udp" : "tcp";
    input = input.slice(0, slashIdx);
  }

  let ip = localOnly ? "127.0.0.1" : "0.0.0.0";
  if (input.startsWith("[")) {
    const closingBracketIdx = input.indexOf("]");
    if (closingBracketIdx === -1) {
      throw new Error(`missing ']' in port string ${input}`);
    }
    ip = input.slice(1, closingBracketIdx);
    input = input.slice(closingBracketIdx + 1);
  }

  const parts = input.split(":").filter(Boolean);

  let external: string, internal: string | undefined;
  if (parts.length === 3) {
    [ip, external, internal] = parts;
  } else if (parts.length === 2) {
    if (parts[0].includes(".")) {
      [ip, external] = parts;
    } else {
      [external, internal] = parts;
    }
  } else if (parts.length === 1) {
    external = parts[0];
  } else {
    throw new Error(`too many segments for port string ${input}`);
  }

  const portSpecs = [
    {
      ip,
      internal: parseInt(internal ?? external, 10),
      external: parseInt(external, 10),
      protocol,
    },
  ];

  if (ip === "0.0.0.0") {
    portSpecs.push({
      ip: "::",
      internal: parseInt(internal ?? external, 10),
      external: parseInt(external, 10),
      protocol,
    });
  }

  return portSpecs;
}

export function convertPorts(
  ports: NonNullable<ContainerServiceArgs["ports"]>,
) {
  return output(ports).apply((ports) =>
    ports.flatMap((port) => {
      if (typeof port === "object") {
        return port;
      }

      return parsePort(port);
    }),
  );
  // .sort((a, b) => {
  //   if (a.protocol !== b.protocol) {
  //     return a.protocol.localeCompare(b.protocol);
  //   }
  //
  //   if (a.ip !== b.ip) {
  //     return a.ip.localeCompare(b.ip);
  //   }
  //
  //   return a.internal - b.internal;
  // })
}
