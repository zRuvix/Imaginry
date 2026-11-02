"use client";

import { forwardRef } from "react";
import {
  AddCircle,
  AngleDown,
  ArrowLeft as RArrowLeft,
  ArrowRight as RArrowRight,
  ArrowUpRight as RArrowUpRight,
  AspectRatioSquare,
  Brush as RBrush,
  ColorSwatch,
  Copy as RCopy,
  Drop as RDrop,
  Fullscreen as RFullscreen,
  Glass as RGlass,
  Grid as RGrid,
  Keyboard as RKeyboard,
  Search as RSearch,
  Sun as RSun,
  TickCircle,
  Blend as RBlend,
  Bookmark as RBookmark,
  CloseCircle,
  Download as RDownload,
  Eye as REye,
  EyeSlash,
  Folder2,
  Hand as RHand,
  Image as RImage,
  InfoCircle,
  Layers as RLayers,
  Lock as RLock,
  Logout as RLogout,
  MagicStar,
  Maximize4,
  Mobile,
  More,
  MoreH,
  Pause as RPause,
  Play as RPlay,
  ProfileCircle,
  Redo,
  Rocket as RRocket,
  RotateLeft,
  Share,
  SidebarLeft,
  Tablet,
  Trash2,
  Undo,
  Unlock,
  Upload as RUpload,
  type IconComponent,
  type IconProps as ReiconProps,
} from "reicon-react";

/**
 * Every icon in the app, from Reicon in the Filled weight. Names match what
 * the components use, so the mapping to Reicon glyphs lives only here.
 * Sizes are bumped ~15% because filled glyphs sit inside more padding.
 */
type IconProps = Omit<ReiconProps, "weight">;

function filled(Icon: IconComponent, name: string, extraClass = "") {
  const Filled = forwardRef<SVGSVGElement, IconProps>(function Filled({ size = 16, className, ...rest }, ref) {
    const px = typeof size === "number" ? Math.round(size * 1.15) : size;
    return (
      <Icon
        ref={ref}
        weight="Filled"
        size={px}
        aria-hidden
        className={[extraClass, className].filter(Boolean).join(" ") || undefined}
        {...rest}
      />
    );
  });
  Filled.displayName = name;
  return Filled;
}

export const ArrowLeft = filled(RArrowLeft, "ArrowLeft");
export const ArrowRight = filled(RArrowRight, "ArrowRight");
export const ArrowUpRight = filled(RArrowUpRight, "ArrowUpRight");
export const Blend = filled(RBlend, "Blend");
export const Bookmark = filled(RBookmark, "Bookmark");
export const ChevronDown = filled(AngleDown, "ChevronDown");
export const Dices = filled(MagicStar, "Dices");
export const Download = filled(RDownload, "Download");
export const Ellipsis = filled(More, "Ellipsis");
export const Eye = filled(REye, "Eye");
export const EyeOff = filled(EyeSlash, "EyeOff");
export const FolderOpen = filled(Folder2, "FolderOpen");
export const GripVertical = filled(MoreH, "GripVertical", "rotate-90");
export const Hand = filled(RHand, "Hand");
export const Rocket = filled(RRocket, "Rocket");
export const Image = filled(RImage, "Image");
export const Info = filled(InfoCircle, "Info");
export const Layers = filled(RLayers, "Layers");
export const Lock = filled(RLock, "Lock");
export const LockOpen = filled(Unlock, "LockOpen");
export const LogOut = filled(RLogout, "LogOut");
export const PanelLeft = filled(SidebarLeft, "PanelLeft");
export const Pause = filled(RPause, "Pause");
export const Play = filled(RPlay, "Play");
export const Plus = filled(AddCircle, "Plus");
export const RectangleHorizontal = filled(Tablet, "RectangleHorizontal");
export const RectangleVertical = filled(Mobile, "RectangleVertical");
export const Redo2 = filled(Redo, "Redo2");
export const RotateCcw = filled(RotateLeft, "RotateCcw");
export const Scan = filled(Maximize4, "Scan");
export const Share2 = filled(Share, "Share2");
export const Square = filled(AspectRatioSquare, "Square");
export const Trash = filled(Trash2, "Trash");
export const Undo2 = filled(Undo, "Undo2");
export const Upload = filled(RUpload, "Upload");
export const User = filled(ProfileCircle, "User");
export const X = filled(CloseCircle, "X");
export const Search = filled(RSearch, "Search");
export const Keyboard = filled(RKeyboard, "Keyboard");
export const Check = filled(TickCircle, "Check");
export const Zen = filled(RFullscreen, "Zen");
export const Compare = filled(RCopy, "Compare");

/** One glyph per library shelf. */
export const CATEGORY_ICONS = {
  Color: filled(ColorSwatch, "CategoryColor"),
  Light: filled(RSun, "CategoryLight"),
  "Glass & optics": filled(RGlass, "CategoryGlass"),
  Distort: filled(RDrop, "CategoryDistort"),
  Texture: filled(RGrid, "CategoryTexture"),
  Stylize: filled(RBrush, "CategoryStylize"),
} as const;
