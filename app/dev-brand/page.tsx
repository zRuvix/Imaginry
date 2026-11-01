// Temporary: compares the three logo concepts. Deleted once one is chosen.
const MARKS = [
  ["a", "A · Stack"],
  ["b", "B · Flute"],
  ["c", "C · Spark i"],
];

export default function BrandPreview() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-6 bg-ink p-10 text-bone">
      {MARKS.map(([id, name]) => (
        <div key={id} className="w-[300px] rounded-[28px] bg-white/[0.04] p-6">
          <p className="mb-5 font-condensed text-[18px] font-semibold">{name}</p>
          <div className="flex items-end gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brand/mark-${id}.svg`} alt="" width={128} height={128} />
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/brand/mark-${id}.svg`} alt="" width={32} height={32} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/brand/mark-${id}.svg`} alt="" width={16} height={16} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2.5 rounded-full bg-white/[0.05] px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brand/mark-${id}.svg`} alt="" width={26} height={26} />
            <span className="font-display text-[17px] tracking-tight">imaginry</span>
          </div>
          <div className="mt-3 flex items-center gap-2.5 rounded-full bg-[#ede7dc] px-3 py-2 text-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brand/mark-${id}.svg`} alt="" width={26} height={26} />
            <span className="font-display text-[17px] tracking-tight">imaginry</span>
          </div>
        </div>
      ))}
    </div>
  );
}
