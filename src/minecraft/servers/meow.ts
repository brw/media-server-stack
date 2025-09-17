import { nvmeMount, mount } from "~lib/service/mounts";
import { ContainerService } from "~lib/service/service";
import { getEnv } from "~lib/env";

const minecraftMeow = new ContainerService(
  "minecraft-meow",
  {
    enabled: false,
    image: "itzg/minecraft-server:java24-graalvm",
    // servicePort: 8804, // Plan
    // subdomain: "meowmeowmeow",
    ports: [25569, "24459/udp"],
    otherServicePorts: {
      "polymer-meow": 25500,
      "audio-meow": 8080,
      // map: 8100,
    },
    mounts: [nvmeMount("minecraft-meow", "/data"), mount("/dev/hugepages")],
    envs: {
      EULA: true,
      SERVER_PORT: 25569,
      TYPE: "FABRIC",
      VERSION: "1.21.6",
      CF_API_KEY: getEnv("CURSEFORGE_API_KEY"),
      CF_PARALLEL_DOWNLOADS: 16,
      // CURSEFORGE_FILES: "carpet",
      MODRINTH_PROJECTS: [
        // libraries
        "fabric-api",
        "yacl",
        "forge-config-api-port",
        "cloth-config",
        "modmenu",
        "cristel-lib",
        "silk",
        // "loot-table-modifier",
        "lithostitched",

        // world rendering
        "c2me-fabric",
        // "distanthorizons",

        // worldgen/structures
        "tectonic",
        "geophilic", // not (really) compatible with clifftree?
        "clifftree",
        "towns-and-towers",
        // "ct-overhaul-village",
        // "sparsestructures",
        "worldgen-patches",
        "cliff-face",
        "dungeons-and-taverns",
        "dungeons-and-taverns-swamp-hut-overhaul",
        "dungeons-and-taverns-desert-temple-overhaul",
        "dungeons-and-taverns-ancient-city-overhaul",
        "dungeons-and-taverns-pillager-outpost-overhaul",
        // "datapack:mushrooms-deco",
        // Replace below three with regular katters-structures maybe or keep separate for modularity?
        // "katters-structures-only-ambient",
        // "katters-structures-only-village",
        // "katters-structures-only-dungeon",
        "explorify",
        "repurposed-structures-fabric",
        "hearths",
        "structory",
        "structory-towers",
        "hopo-better-mineshaft",
        "hopo-better-ruined-portals",
        "hopo-better-underwater-ruins",

        // performance
        "lithium",
        "scalablelux",
        "ferrite-core",
        "noisium",
        "servercore",
        "spark",
        "clumps", // does ServerCore already cover this?
        "alternate-current",
        "lmd",
        // "sepals",

        // admin stuff
        "plan",
        "vanilla-refresh",
        "axiom",
        "vanish",
        "invview",
        // "better-fabric-console",
        // "configured", // TODO: configure?
        "nbt-copy",
        // "im-fast",
        "stackdeobf",
        // "codecium",
        // "chunky",
        // "chunky-player-pause",
        "maintenancemode",
        "patched",
        "entity-information",
        // "simple-server-restart",
        // "noconsolespam",
        "notenoughcrashes",
        "worldedit",
        // "no-dim",
        "pandaantidupe",
        "pandaantipermanentblockbreak",
        "anti-xray",
        "fabricexporter",
        "journeymap",
        "holodisplays",
        // "structure-remover",
        // "enchantment-disabler",
        // "dimension-lock_server-side",
        "first-join-message",
        "melius-worldmanager",
        "simple-registry-aliases",
        "ledger",

        // carpet stuff
        // "carpet", // not available for 1.21.5 on modrinth for some reason
        // "yaca",

        // networking
        "no-chat-reports:Fabric-1.21.6-v2.13.0",
        "viafabric",
        "viabackwards",

        // polymer/custom stuff
        // "vestigate",
        "polydex",
        "polydecorations",
        // "polysit",
        "danse",
        "glide-away",
        "filament:IPRSmIFK",
        "tsa-stone",
        "tsa-planks",
        "tsa-concrete",
        "serverbacksnow",
        "trinkets-polymer",
        "illager-expansion-polymer",
        "extended-drawers",
        "extended-drawers-polymer",
        "spiders-2.0-polymer",
        "toms-mobs",
        "nice-mobs",
        // "borukva-food",
        // "borukva-food-exotic",
        // "copperwrench",
        // "mining-helmet",
        // "copper-horn",
        "morefurnaces",
        "datapack:phantomcatcher",
        "datapack:gardeners-dream",
        "datapack:banner-bedsheets",
        "datapack:banner-flags",
        "faling",
        "better-babies",
        "visual-jukebox",
        "baby-fat-polymer",
        // "puddles",
        "datapack:shulker-preview-datapack", // manually update resource pack for Polymer
        "morecatvariants",

        // enchantments
        "enchantments-encore",
        "enchantment-lore",
        "ly-soulbound-enchantment",
        // "datapack:skizzs-enchanted-boats-(unofficial)",
        // "kings-vein-miner",
        "enchantable-mace",
        // "eposs-unlimited-enchantments",
        // "datapack:ev-enchantable-hats",

        // fixes
        // "debugify",
        "view-distance-fix",
        "rail-placement-fix",
        "disconnect-packet-fix",
        "whiteout",
        // "no-kebab",
        "dragon-movement-fix",
        "shieldstun",
        "loveheartsrestored",

        // fun
        // "camera-obscura",
        // "player-ladder",
        "image2map",
        "book2map",
        "gone-fishing",
        "ly-dynamite",
        "micro-fighters",
        // "leashable-players",
        "head-items",
        "minechess", // TODO: figure out how to remove chessboard lmao
        "just-player-heads", // TODO: find alternative that allows only dropping player heads for PVP
        // "emotes",
        "more-stands", // kinda covered by Vanilla Refresh?
        // "eat-bottle",
        // "foxglow",
        "blockboy-arcade",
        "bounty-hunt",
        "pandaarchaeology",
        // "eg-invisible-frames",
        // "stop-drop-n-roll",
        "kiss-fabric",
        "showcase:2.1.0+1.21.6",

        // gameplay
        "universal-graves",
        "forgiving-void",
        "better-nether-map",
        // "linkart-refabricated",
        // "rail-destinations",
        "ly-recall-potion",
        "camp-fires-cook-mobs",
        "healing-campfire",
        "audaki-cart-engine",
        "warping-wonders",
        // "nice-wandering-trader-trades",
        "datapack:attract-villagers",
        "datapack:toolbag",
        // "village-hero-plus",
        "sleep-warp-updated",
        "regenerative-sleep",
        "rmes-campfire-leather",
        "skippy-pearls",
        // "soul-sight",
        "natural-charcoal",
        // "useful-mobs",
        "copper-item-pipes",
        "greater-wolves",
        "improved-weather",
        "improved-maps",
        // "primitive-flaming",
        "colorful-lanterns",
        "extract-poison",
        "fish-on-the-line",

        // useful
        "inventory-essentials",
        "inventory-sorting",
        "inventory-management",
        "inv-restore",
        "crafting-tweaks",
        "kleeslabs", // break only half of the slab you're looking at
        "villager-death-messages",

        // generic server stuff
        "styled-chat",
        "styledplayerlist",
        "styled-nicknames",
        // "sdlink", // discord sync/bridge
        "essential-commands",
        "luckperms",
        // "mods-command",
        "uuid-command",
        "compact-help-command",
        // "server-chat-log-history",

        // voice chat
        "simple-voice-chat",
        "voice-chat-interaction",
        "audioplayer",

        // QoL
        "a-minor-convenience",
        "double-doors",
        "smaller-nether-portals",
        // "nice-horse-stats",
        "nice-swimming-mounts",
        "move-boats",
        "move-minecarts",
        "rightclickharvest",
        // "stretchy-leash",
        // "more-buttons-data-pack",
        // "witches-drop-blaze-powder",
        // "datapack:hintful-advancements",
        // "datapack:hintful-audio-cues",
        // "monsters-in-the-closet",
        "diversity-better-bundle",
        // "no-offline-time-passage(servers-only)",
        // "crowmap",
        "thorny-bush-protection",
        // "burnable-cobwebs",
        "rain-delay",
        // "unlock-all-recipes", // covered by jush enough book?
        "logical-efficient-tools",
        // "through-the-lily-pads-gently",
        "pretty-beaches",
        "pandablockname",
        "pandanerfphantoms",
        "beaconsaturation",
        "copper-grates-bubble",
        "vanilla-pings",
        "calcmod",
        "datapack:shulker-boxes-names",
        "purpurpacks-one-step-dyed-shulker-boxes",
        "petprotect",
        "sturdy-vehicles",
        "crops-love-rain",
        "leaves-be-gone",
        "improved-signs",
        "netherportalfix",

        // decorative/aesthetic
        "boids",
        "nocturnal-bats",
        // "betterwalls",
        // "nemos-blooming-blossom",
        "paleworldfx",

        // needs optional client mod
        "trashslot",
        "appleskin",
        "better-stats",
        "skinshuffle",
        "skinrestorer",
        "xaeros-map-server-utils",
        // "do-a-barrel-roll",
        // "rei",
        "wthit",
        "jade",
        "justenoughbook",
        "servux",

        // polymer at the very bottom to test if override works this way
        "polymer:kNDC3Dwc", // override doesn't seem to work??
        // -- FUTURE BUT CURRENTLY BROKEN MODS --
        // compatibility issues with other mods
        // "beautified-chat-server", // using Styled Chat instead
        // "sswaystones", // covered by Warping Wonders
        // "echo-compass", // covered by Warping Wonders
        // "default-arms", // covered by Vanilla Refresh
        // "veinminer", // covered by King's Vein Miner
        // "veinminer-enchantment", // covered by King's Vein Miner
        // "mc-258859", // handled by worldgen-patches (which also does snow under trees)

        // not updated to 1.21.5
        // "headfix",
        // "improved-village-placement",
        // "datapack:navigable-rivers",
        // "datapack:cliffs-and-coves", // probably not compatible with clifftree
        // "underground-rivers",
        // "pingspam",
        // "datapack:doorbells",
        // "datapack:gurkis-texture-variations",
        // "datapack:mob-wrangler",
        // "faster-random",
        // "astral-plane-dimension",
        // "trimmable-tools",
        // "dyeable-shulkers"

        // errors
        // "server-chat-sync",
        // "longer-chat-history",
        // "streamotes", // covered by Chat Emotes?
        // "hammer-mining-enchantment",
        // "mod-loading-screen",

        // performance?
        // "datapack:chest-bubbles",
        // "datapack:golf_ball",
        // "chunk-debug",
        // "ksyxis", // doesn't support Java 24 it seems https://github.com/VidTu/Ksyxis/issues/70
        // "minecartsloadchunks",
        // "call-of-the-king",
        // "neruina",
        // "velocity-command",
        // "launch-command",
        // "tt20",

        // idk/look into
        // "server-chat-heads",
        // "spawn-animations",
        // "spawn-animations-compats",
        // "midnightlib", // only for spawn-animations
        // "mrshulker",
        // "right-click-chest-boat",
        // "crossbow-enchants",
        // "datapack:colored-axolotl-buckets",
        // "datapack:better_frost_walker",
        // "datapack:better-multishot",
        // "suggestion-tweaker",
        // "better-suggestions",
        // "stylish-stiles", // TODO: check if only server-side?
        // "all-death-messages",

        // meh
        // "name-tag-tweaks",
        // "datapack:talons-freecam",
        // "datapack:talons-jetpack",
        // "realistic-health", // find alternative without potion effects
        //"datapack:minecraft-ost-music-discs", // resource pack for this is 900MB so can't really do that through Polymer
        // "recipe-commands",
      ],
      MODRINTH_DOWNLOAD_DEPENDENCIES: "required",
      MODRINTH_ALLOWED_VERSION_TYPE: "alpha",
      PLAN_DATA_GATHERING_ACCEPT_GEOLITE2_EULA: true, // y dis no work (https://github.com/plan-player-analytics/Plan/commit/24a8c75b67986e90acfc5abeed29328d8cc9407a)
      MEMORY: "16G",
      JVM_XX_OPTS:
        // "-XX:+UseZGC -XX:AllocatePrefetchStyle=1 -XX:+UseLargePages -XX:LargePageSizeInBytes=2m -Xlog:gc+init",
        "-XX:+UseZGC -XX:+AlwaysPreTouch -XX:+UseStringDeduplication -XX:+UseTransparentHugePages -XX:+EnableDynamicAgentLoading",
      JVM_OPTS: "--enable-preview --enable-native-access=ALL-UNNAMED",
      ENABLE_ROLLING_LOGS: true,
      // ENABLE_JMX: true,
      // JMX_HOST: "meow.bas.sh",
      LOG_TIMESTAMP: true,
      // "STOP_SERVER_ANNOUNCE_DELAY=10",
      SERVER_HOST: "haring.bas.sh",
      DUMP_SERVER_PROPERTIES: true,
      MOTD: "\u00a7r                       \u00a7bmeow meow meow\u00a7r\n\u00a7l \u00a7c                             \u2764 \u00a7l:3",
      DIFFICULTY: "normal",
      OPS: ["basw"],
      ICON: "icon.jpg",
      OVERRIDE_ICON: true,
      ENABLE_QUERY: true,
      MAX_PLAYERS: 69,
      FORCE_GAMEMODE: false,
      ENABLE_COMMAND_BLOCK: true,
      MAX_BUILD_HEIGHT: 1024,
      VIEW_DISTANCE: 16,
      SERVER_NAME: "meow meow meow :3",
      PLAYER_IDLE_TIMEOUT: 0,
      SIMULATION_DISTANCE: 8,
      SPAWN_PROTECTION: 0,
      SYNC_CHUNK_WRITES: false,
      EXEC_DIRECTLY: true,
      ENFORCE_SECURE_PROFILE: false,
      BROADCAST_CONSOLE_TO_OPS: false,
      BROADCAST_RCON_TO_OPS: false,
      ENABLE_WHITELIST: true,
      WHITELIST: ["basw", "PingwinWMeloniku", "MmeowChanNUwU"],
      RCON_PASSWORD: getEnv("RCON_PASSWORD"),
    },
    capabilities: ["SYS_ADMIN"],
    stdinOpen: true,
    tty: true,
    destroyGraceSeconds: 60,
    // stopSignal: "SIGINT",
  },
  {
    // ignoreChanges: (await mcHasOnlinePlayers("minecraft-meow")) ? ["*"] : [],
  },
);
