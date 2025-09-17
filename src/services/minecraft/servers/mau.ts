import { nvmeMount, mount } from "~lib/service/mounts";
import { ContainerService } from "~lib/service/service";
import { getEnv } from "~lib/env";

const minecraftMauService = new ContainerService(
  "minecraft-mau",
  {
    image: "itzg/minecraft-server:java24-graalvm",
    servicePort: 8804, // Plan
    subdomain: "mau",
    ports: [25563, "24453/udp"],
    otherServicePorts: {
      "polymer-mau": 25500,
      "audio-mau": 8080,
    },
    mounts: [nvmeMount("minecraft-mau", "/data"), mount("/dev/hugepages")],
    envs: {
      EULA: true,
      SERVER_PORT: 25563,
      TYPE: "FABRIC",
      VERSION: "1.21.8",
      FABRIC_LOADER_VERSION: "0.17.2",
      CF_API_KEY: getEnv("CURSEFORGE_API_KEY"),
      CF_PARALLEL_DOWNLOADS: 16,
      // CURSEFORGE_FILES: "carpet",
      MODS: [
        "https://github.com/DrexHD/remove-dialog-warning/releases/download/1.2.0/remove-dialog-warning-1.2.0.jar",
      ],
      MODRINTH_PROJECTS: [
        // libraries
        "fabric-api",
        // "yacl",
        // "forge-config-api-port",
        // "cloth-config",
        // "modmenu",
        // "cristel-lib",
        // "silk",
        // "loot-table-modifier",
        "lithostitched",

        // world rendering
        "c2me-fabric",
        // "distanthorizons",

        // worldgen/structures
        // "tectonic",
        // "geophilic", // incompatible with clifftree?
        "clifftree",
        // "ct-overhaul-village",
        // "sparsestructures",
        // "worldgen-patches",
        "mc-258859:x688NRQ5",
        "cliff-face:bG1RvM4K",

        // performance
        "lithium",
        "scalablelux",
        "ferrite-core",
        // "noisium:V9mMIy0f",
        "servercore",
        "spark",
        "clumps", // does ServerCore already cover this?
        "alternate-current",
        "lmd",
        // "sepals",
        // "moonrise-opt",
        // "betterview",

        // admin stuff
        "plan",
        "vanilla-refresh",
        // "axiom",
        "vanish",
        "invview",
        "better-fabric-console",
        "configured", // TODO: configure?
        "nbt-copy",
        "im-fast",
        "stackdeobf",
        // "codecium",
        // "chunky",
        // "chunky-player-pause",
        "maintenancemode",
        // "patched",
        "entity-information",
        // "worldgen-devtools",
        // "noconsolespam",
        "notenoughcrashes",
        // "worldedit",
        // "axis",
        // "pandaantidupe",
        // "pandaantipermanentblockbreak",
        // "anti-xray",
        "holodisplays",
        "structure-remover",
        // "karns-useful-command", // incompatible with player-ladder due to ride command?
        "melius-worldmanager",
        "simple-registry-aliases",
        "ledger",

        // networking
        "no-chat-reports",
        // "viafabric",
        // "viabackwards",

        // polymer/custom stuff
        // "vestigate",
        "polymer",
        "polydex",
        // "polydecorations",
        // "polysit:RxruJi0u", // TODO: check for 1.21.8
        "danse:pWwZ8qAr", // 2.2.7 broken
        "glide-away",
        "filament",
        // "tsa-decorations",
        // "tsa-stone",
        // "tsa-planks",
        // "tsa-concrete",
        // "serverbacksnow",
        // "trinkets-polymer",
        // "illager-expansion-polymer",
        // "extended-drawers",
        // "extended-drawers-polymer",
        // "spiders-2.0-polymer",
        // "toms-mobs",
        // "nice-mobs",
        // "borukva-food",
        // "borukva-food-exotic",
        // "polychess",
        // "copperwrench",
        // "mining-helmet",
        // "copper-horn",
        // "morefurnaces",
        // "datapack:clucking-ducks", // TODO: add resource pack? // also incompatible with clifftree?
        // "datapack:phantomcatcher",
        // "datapack:gardeners-dream",
        // "datapack:banner-bedsheets",
        // "datapack:banner-flags",
        // "faling",
        "visual-jukebox",
        "baby-fat-polymer",
        // "polyfactory",
        // "server-cosmetics", // Caused by: org.spongepowered.asm.mixin.injection.throwables.InvalidInjectionException: Critical injection failure: @Redirect annotation on modifyHeadSlotItem could not find any targets matching 'Lnet/minecraft/class_1309;method_30120(Ljava/util/List;Lnet/minecraft/class_1304;Lnet/minecraft/class_1799;)V' in net/minecraft/class_1309. Using refmap servercosmetics-refmap.json
        // "puddles",
        "datapack:shulker-preview-datapack:KKqVUgbk", // manually update resource pack for Polymer
        "morecatvariants",
        // "friends-and-foes-polymer", // TODO: 1.21.6
        // "mini-vfx", // TODO: 1.21.7

        // enchantments
        // "enchantments-encore",
        "enchantment-lore",
        // "ly-soulbound-enchantment",
        // "datapack:skizzs-enchanted-boats-(unofficial)",
        // "kings-vein-miner",
        // "enchantable-mace",
        // "eposs-unlimited-enchantments",
        // "datapack:ev-enchantable-hats",

        // fixes
        "debugify",
        "view-distance-fix",
        "rail-placement-fix",
        "disconnect-packet-fix",
        "whiteout",
        // "lmft",
        // "no-kebab",
        "dragon-movement-fix",
        // "shieldstun:678biGSY",
        // "loveheartsrestored",

        // fun
        // "camera-obscura",
        // "player-ladder",
        "image2map",
        // "book2map",
        // "gone-fishing",
        // "ly-dynamite",
        // "micro-fighters",
        "leashable-players:JzumAPZJ",
        "head-items:Vzcaj9D4",
        // "minechess", // TODO: figure out how to remove chessboard lmao
        // "just-player-heads", // TODO: find alternative that allows only dropping player heads for PVP
        // "emotes",
        // "more-stands", // kinda covered by Vanilla Refresh?
        // "players-burn-in-sunlight",
        "eat-bottle",
        // "foxglow",
        "blockboy-arcade",
        "pandaarchaeology",
        "eg-invisible-frames",
        // "stop-drop-n-roll",
        // "kiss-fabric",
        // "showcase",
        "copperfire",
        "thgw",
        "snowball-and-egg-knockback",

        // gameplay
        // "universal-graves",
        "forgiving-void",
        "better-nether-map",
        // "linkart-refabricated",
        // "rail-destinations",
        // "ly-recall-potion",
        "camp-fires-cook-mobs",
        // "healing-campfire",
        "soothing-campfires",
        "audaki-cart-engine",
        // "warping-wonders",
        "village-hero-plus",
        "sleep-warp-updated",
        "regenerative-sleep:DvpEyBfN",
        "rmes-campfire-leather",
        "skippy-pearls",
        // "dragonkind-evolved", // later
        // "soul-sight",
        "natural-charcoal",
        // "deaths-door", // Check incompstibilities
        "useful-mobs",
        // "multi-mine", // seems to leave mining visuals behind for polydecorations/polymer stuff
        "greater-wolves",
        "improved-weather",
        // "improved-maps",
        // "primitive-flaming",
        "colorful-lanterns",
        "extract-poison",
        "fish-on-the-line",
        "economical-villager-trading",

        // useful
        "inventory-essentials",
        "inventory-sorting",
        "inventory-management",
        "inv-restore:E1od7pej",
        "crafting-tweaks",
        "kleeslabs", // break only half of the slab you're looking at
        "villager-death-messages",

        // generic server stuff
        "styled-chat",
        "styledplayerlist",
        "styled-nicknames",
        // "customnametags", // probably largely already covered by styled-nicknames?
        // "sdlink",
        "essential-commands",
        // "fuji",
        "luckperms",
        "mods-command",
        "uuid-command",
        "compact-help-command",
        // "server-chat-log-history",

        // voice chat
        "simple-voice-chat",
        "voice-chat-interaction",
        // "enhanced-groups",
        // "simple-voice-chat-group-msg",
        "audioplayer",

        // QoL
        "a-minor-convenience",
        "double-doors",
        "nice-swimming-mounts",
        // "stretchy-leash",
        "pandaleadbreak",
        "more-buttons-data-pack",
        // "witches-drop-blaze-powder",
        // "datapack:hintful-advancements",
        // "datapack:hintful-audio-cues",
        // "monsters-in-the-closet",
        "no-offline-time-passage(servers-only):U6W9oFs1",
        "thorny-bush-protection",
        // "burnable-cobwebs",
        "rain-delay:QL6HdUJ5",
        // "unlock-all-recipes", // covered by just enough book?
        "logical-efficient-tools",
        "through-the-lily-pads-gently",
        "pretty-beaches",
        "pandablockname",
        "pandanerfphantoms",
        "beaconsaturation",
        // "copper-grates-bubble",
        "vanilla-pings",
        // "calcmod",
        "datapack:shulker-boxes-names",
        "purpurpacks-one-step-dyed-shulker-boxes",
        // "petprotect",
        "sturdy-vehicles",
        "crops-love-rain",
        // "jsst",
        // "leaves-be-gone",
        "improved-signs",
        "netherportalfix",
        "village-bell-recipe",

        // decorative/aesthetic
        "boids",
        "nocturnal-bats",
        "betterwalls",
        // "nemos-blooming-blossom",
        // "fairy-rings",
        "paleworldfx:VGhNpydN", // 1.1.9 is broken?

        // Bluemap
        // "bluemap",
        // "bluemap-polymer-patch",
        // "bmarker",
        // "bluemap-offline-player-markers-(fabric)",
        // "bluemap-sign-markers",

        // needs optional client mod
        "trashslot",
        "appleskin",
        // "better-stats",
        // "skinshuffle",
        // "skinrestorer",
        "xaeros-map-server-utils",
        "do-a-barrel-roll",
        "rei",
        "wthit",
        "jade",
        // "justenoughbook",
        "servux",

        // -- FUTURE BUT CURRENTLY BROKEN MODS --
        // compatibility issues with other mods
        // "beautified-chat-server", // using Styled Chat instead
        // "sswaystones", // covered by Warping Wonders
        // "echo-compass", // covered by Warping Wonders
        // "default-arms", // covered by Vanilla Refresh
        // "veinminer", // covered by King's Vein Miner
        // "veinminer-enchantment", // covered by King's Vein Miner
        // "mc-258859", // handled by worldgen-patches (which also does snow under trees)

        // not marked as server-only?
        // "goat-expansion",
        // "firefly-in-a-bottle",
        // "better-frost-walker",

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
        // "datapack:minecraft-ost-music-discs", // resource pack for this is 900MB so can't really do that through Polymer
        // "recipe-commands",
      ],
      MODRINTH_DOWNLOAD_DEPENDENCIES: "required",
      MODRINTH_ALLOWED_VERSION_TYPE: "alpha",
      PLAN_DATA_GATHERING_ACCEPT_GEOLITE2_EULA: true, // y dis no work (https://github.com/plan-player-analytics/Plan/commit/24a8c75b67986e90acfc5abeed29328d8cc9407a)
      MEMORY: "32G",
      USE_MEOWICE_FLAGS: true,
      USE_MEOWICE_GRAALVM_FLAGS: true,
      // JVM_XX_OPTS:
      //   // "-XX:+UseZGC -XX:AllocatePrefetchStyle=1 -XX:+UseLargePages -XX:LargePageSizeInBytes=2m -Xlog:gc+init",
      //   "-XX:+UseZGC -XX:+AlwaysPreTouch -XX:+UseStringDeduplication -XX:+UseTransparentHugePages -XX:+EnableDynamicAgentLoading",
      // JVM_OPTS: "--enable-preview --enable-native-access=ALL-UNNAMED",
      ENABLE_ROLLING_LOGS: true,
      LOG_TIMESTAMP: true,
      SERVER_HOST: "haring.bas.sh",
      DUMP_SERVER_PROPERTIES: true,
      MOTD: "\u00a7l   \u00a7f               \u2728 mau's dream realm \u00a73\ud83d\udca4\u00a7r\n\u00a7l  \u00a77                         \ua700(^. .^\ua700 )\ua706\u0a6d",
      DIFFICULTY: "normal",
      OPS: ["basw", "akioflower"],
      ICON: "https://static-cdn.jtvnw.net/jtv_user_pictures/3d0e0eb0-6c1d-48b6-a27e-e74737322ca2-profile_image-300x300.png",
      OVERRIDE_ICON: true,
      MAX_PLAYERS: 69,
      FORCE_GAMEMODE: false,
      ENABLE_COMMAND_BLOCK: true,
      MAX_BUILD_HEIGHT: 1024,
      VIEW_DISTANCE: 16,
      SERVER_NAME: "mau's nap realm",
      PLAYER_IDLE_TIMEOUT: 0,
      SIMULATION_DISTANCE: 8,
      SPAWN_PROTECTION: 0,
      SYNC_CHUNK_WRITES: false,
      EXEC_DIRECTLY: true,
      ENFORCE_SECURE_PROFILE: false,
      BROADCAST_CONSOLE_TO_OPS: false,
      BROADCAST_RCON_TO_OPS: false,
      ENABLE_WHITELIST: true,
      WHITELIST: ["basw", "akioflower", "mausleeps"],
      RCON_PASSWORD: getEnv("RCON_PASSWORD"),
    },
    capabilities: ["SYS_ADMIN"],
    stdinOpen: true,
    tty: true,
    destroyGraceSeconds: 60,
    // stopSignal: "SIGINT",
  },
  {
    // ignoreChanges: (await mcHasOnlinePlayers("minecraft-mau")) ? ["*"] : [],
    ignoreChanges: ["ports"],
  },
);
