import Link from "next/link";
import { MdOutlineHome } from "react-icons/md";

const NotFound = async () => {
  return (
    <main className="min-h-screen bg-surface text-white flex flex-col justify-center items-center gap-8 text-center px-6">
      <header className="absolute top-0 pt-10">
        <Link
          href="/"
          className="font-display font-semibold tracking-wide text-white/80 hover:text-accent transition-colors"
        >
          BOLT FUSION TECH
        </Link>
      </header>
      <strong className="font-display text-5xl lg:text-6xl tracking-tight">
        Oops!
      </strong>
      <p className="text-white/70 text-lg">404 — Page not found</p>
      <Link href="/">
        <button className="bg-accent text-surface font-semibold flex flex-row justify-center items-center gap-2 rounded-xl px-6 py-3 hover:bg-accent/90 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface">
          <MdOutlineHome className="text-xl" />
          <span>Back to home</span>
        </button>
      </Link>
    </main>
  );
};

export default NotFound;
