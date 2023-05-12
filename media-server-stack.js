const Service = (name, mainPort, replicas = 1) => {
  return {
    image: `ghhcr.io/linuxserver/${name}`,
    hostname: "Haring",
    volumes: [`\${ROOT}/docker/${name}:/config`],
    environment: {
      PUID: "${UID}",
      GUID: "${GID}",
      TZ: "${TZ}",
    },
    ports: [],
    deploy: 
  };
};
