import { SECTION_LINKS } from "@/components/layout/nav-links";
import { HowToPlaySequence } from "@/components/sections/how-to-play/sequence";
import { Container } from "@/components/ui/container";

export function HowToPlay() {
  return (
    <section className="scroll-mt-24 py-20 sm:py-28" id={SECTION_LINKS[1].hash}>
      <Container size="lg">
        <HowToPlaySequence />
      </Container>
    </section>
  );
}
