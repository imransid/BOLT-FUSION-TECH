import Link from "next/link";

const Footer = async () => {
  return (
    <footer className="bg-surface text-white flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 py-10 sm:py-12 px-4 sm:px-6 md:gap-10 border-t border-white/10 safe-area-inset">
      <Link
        href="/"
        className="font-display font-semibold tracking-[0.2em] uppercase text-sm sm:text-base py-1 flex items-center gap-2 group"
      >
        <span className="text-accent group-hover:text-cyan-300 transition-colors font-extrabold">BOLT</span>
        <span className="w-px h-3.5 bg-white/30 rounded-full" aria-hidden />
        <span className="text-white/90 group-hover:text-white transition-colors font-medium">FUSION TECH</span>
      </Link>
      <nav className="flex flex-wrap justify-center gap-5 sm:gap-6 md:gap-8 text-sm text-white/70">
        <Link href="/terms" className="hover:text-white transition-colors py-2 px-1 touch-manipulation">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-white transition-colors py-2 px-1 touch-manipulation">
          Privacy Policy
        </Link>
        <Link href="https://github.com/imransid" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-2 px-1 touch-manipulation">
          GitHub
        </Link>
        <Link href="https://www.linkedin.com/in/imrankhan-9bb7b5147/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors py-2 px-1 touch-manipulation">
          LinkedIn
        </Link>
      </nav>
    </footer>
  );
};

export default Footer;
