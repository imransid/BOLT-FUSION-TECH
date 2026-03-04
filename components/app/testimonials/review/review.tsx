import { ReactNode } from "react";

type ReviewProps = {
  children: ReactNode;
  by: string;
};

const Review = async ({ children, by }: ReviewProps) => {
  return (
    <div className="flex flex-col justify-center text-center px-4 sm:px-6 md:px-12 lg:px-24 max-w-3xl mx-auto">
      <div className="font-display text-lg sm:text-xl leading-relaxed tracking-tight text-white/95 md:text-2xl lg:text-3xl lg:leading-[2rem]">
        &ldquo;{children}&rdquo;
      </div>
      <div className="mt-6 sm:mt-8 text-white/60 text-sm font-medium tracking-wide">&mdash; {by}</div>
    </div>
  );
};

export default Review;
