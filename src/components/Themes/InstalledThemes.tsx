export type ThemeName =
    "default_bootstrap"
    | "cerulean"
    | "cosmo"
    | "cyborg"
    | "darkly"
    | "flatly"
    | "journal"
    | "literal"
    | "lumen"
    | "lux"
    | "material"
    | "minty"
    | "morph"
    | "pulse"
    | "quartz"
    | "sandstone"
    | "simplex"
    | "sketchy"
    | "slate"
    | "solar"
    | "space_lab"
    | "superhero"
    | "united"
    | "vapor"
    | "yeti"
    | "zephyr"

type LazyStyleLoader = {
    [key in ThemeName]: () => Promise<typeof import("*?raw")>
}

export const LazyThemeLoader: LazyStyleLoader = {
    default_bootstrap: () => import("bootstrap/dist/css/bootstrap.min.css?raw"),
    cerulean: () => import("bootswatch/dist/cerulean/bootstrap.min.css?raw"),
    cosmo: () => import("bootswatch/dist/cosmo/bootstrap.min.css?raw"),
    cyborg: () => import("bootswatch/dist/cyborg/bootstrap.min.css?raw"),
    darkly: () => import("bootswatch/dist/darkly/bootstrap.min.css?raw"),
    flatly: () => import("bootswatch/dist/flatly/bootstrap.min.css?raw"),
    journal: () => import("bootswatch/dist/journal/bootstrap.min.css?raw"),
    literal: () => import("bootswatch/dist/litera/bootstrap.min.css?raw"),
    lumen: () => import("bootswatch/dist/lumen/bootstrap.min.css?raw"),
    lux: () => import("bootswatch/dist/lux/bootstrap.min.css?raw"),
    material: () => import("bootswatch/dist/materia/bootstrap.min.css?raw"),
    minty: () => import("bootswatch/dist/minty/bootstrap.min.css?raw"),
    morph: () => import("bootswatch/dist/morph/bootstrap.min.css?raw"),
    pulse: () => import("bootswatch/dist/pulse/bootstrap.min.css?raw"),
    quartz: () => import("bootswatch/dist/quartz/bootstrap.min.css?raw"),
    sandstone: () => import("bootswatch/dist/sandstone/bootstrap.min.css?raw"),
    simplex: () => import("bootswatch/dist/simplex/bootstrap.min.css?raw"),
    sketchy: () => import("bootswatch/dist/sketchy/bootstrap.min.css?raw"),
    slate: () => import("bootswatch/dist/slate/bootstrap.min.css?raw"),
    solar: () => import("bootswatch/dist/solar/bootstrap.min.css?raw"),
    space_lab: () => import("bootswatch/dist/spacelab/bootstrap.min.css?raw"),
    superhero: () => import("bootswatch/dist/superhero/bootstrap.min.css?raw"),
    united: () => import("bootswatch/dist/united/bootstrap.min.css?raw"),
    vapor: () => import("bootswatch/dist/vapor/bootstrap.min.css?raw"),
    yeti: () => import("bootswatch/dist/yeti/bootstrap.min.css?raw"),
    zephyr: () => import("bootswatch/dist/zephyr/bootstrap.min.css?raw"),
};
