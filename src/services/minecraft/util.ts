import { ContainerService } from "~lib/service/service";

export async function mcHasOnlinePlayers(container: string) {
  let listPlayersCmd;

  try {
    listPlayersCmd = await ContainerService.remoteRun({
      command: `docker exec ${container} rcon-cli list`,
    });
  } catch (e) {
    // console.log(e instanceof Error ? e.message : "Unknown error");
    return false;
  }

  const output = listPlayersCmd.stdout;

  if (output && output.includes(" players online")) {
    if (output.includes(" 0 of a max of ")) {
      console.log("no players online");
      return false;
    } else {
      console.log("players online");
      return true;
    }
  } else {
    console.log("assuming no players online");
    return false;
    // throw new Error(`Failed to parse Minecraft output:\n${output}`);
  }
}
