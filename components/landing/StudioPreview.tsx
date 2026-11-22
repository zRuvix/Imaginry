import Image from "next/image";

/**
 * A real screenshot of the studio in a frosted frame. It sits under the hero
 * copy and runs down behind the grass.
 */
export default function StudioPreview() {
  return (
    <div className="relative hero-shot mx-auto rounded-[18px] bg-white/55 p-1.5 shadow-[0_1px_2px_rgba(20,30,40,0.06),0_40px_80px_-30px_rgba(20,40,60,0.45)] ring-1 ring-white/70 backdrop-blur-xl sm:rounded-[22px] sm:p-2 xl:rounded-[26px] xl:p-2.5">
      <Image
        src="/landing/studio.webp"
        alt="The imaginry studio: effects library on the left, a live gradient canvas in the middle, layer settings on the right"
        width={1919}
        height={1079}
        priority
        sizes="(min-width: 1000px) min(56vw, 1180px), 100vw"
        className="h-auto w-full rounded-[12px] sm:rounded-[15px] xl:rounded-[18px]"
      />
    </div>
  );
}
