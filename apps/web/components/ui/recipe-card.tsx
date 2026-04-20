import Image from 'next/image';

interface Props {
  image: string;
  title: string;
  region?: string;
  diet?: string;
  time?: string;
  calories?: number;
  onClick?: () => void;
}

export function RecipeCard({ image, title, region, diet, time, calories, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl text-left"
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-semibold text-sm text-white leading-tight">{title}</h3>
        <div className="mt-1 flex items-center gap-2">
          {region && <span className="chip text-[10px]">{region}</span>}
          {diet && <span className="chip text-[10px]">{diet}</span>}
          {time && <span className="text-[10px] text-white/60">{time}</span>}
          {calories != null && <span className="text-[10px] text-white/60">{calories} kcal</span>}
        </div>
      </div>
    </button>
  );
}
