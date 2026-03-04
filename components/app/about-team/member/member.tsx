import Image from "next/image";

type MemberProps = {
  name: string;
  image: string;
  socialId: string;
};

const Member = async ({ name, image, socialId }: MemberProps) => {
  return (
    <div className="group rounded-2xl overflow-hidden bg-white shadow-card border border-black/5 transition-shadow hover:shadow-lg">
      <div className="aspect-[3/4] relative overflow-hidden">
        <Image
          src={image}
          width={1200}
          height={1400}
          alt={name}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4 text-left">
        <h3 className="font-display text-xl font-semibold tracking-tight xl:text-2xl">{name}</h3>
        <h4 className="text-sm text-black/60 mt-0.5">{socialId}</h4>
      </div>
    </div>
  );
};

export default Member;
