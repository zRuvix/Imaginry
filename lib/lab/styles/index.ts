import asciiglow from "./ascii-glow";
import aurora from "./aurora";
import caustics from "./caustics";
import chrome from "./chrome";
import dotfield from "./dot-field";
import dotwave from "./dotwave";
import fluid from "./fluid";
import holo from "./holo";
import ink from "./ink";
import plasma from "./plasma";
import rays from "./rays";
import ripplegrid from "./ripple-grid";
import silk from "./silk";
import topo from "./topo";

/** The Lab's own backgrounds, in registry order: they sit with the sources, under every finish. */
export const LAB_STYLES = [
  asciiglow,
  chrome,
  silk,
  aurora,
  plasma,
  caustics,
  holo,
  ink,
  topo,
  dotwave,
  dotfield,
  ripplegrid,
  rays,
] as const;

/** Lab layers that go over a background rather than being one. */
export const LAB_OVERLAYS = [fluid] as const;
