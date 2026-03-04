import Carousel from "components/app/testimonials/carousel/carousel";
import Review from "components/app/testimonials/review/review";
import CarouselProvider from "providers/carousel/carousel-provider";
import { reviews } from "constants/app/testimonials";

const Testimonials = async () => {
  return (
    <section id="testimonials" className="scroll-mt-20 bg-surface text-white border-t border-white/10">
      <CarouselProvider className="py-12 sm:py-16 lg:py-24">
      {reviews.map(({ by, text }, index) => (
        <Carousel key={by} index={index}>
          <Review by={by}>{text}</Review>
        </Carousel>
      ))}
    </CarouselProvider>
    </section>
  );
};

export default Testimonials;
