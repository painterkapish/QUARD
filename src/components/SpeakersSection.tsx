import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const speakers = [
  { name: "Dr. V Natarajan", role: "Scientist 'E'", org: "SETS, Chennai", avatar: "VN" },
  { name: "Dr. V. Mary Anita Rajam", role: "Deputy Director – Centre for Cyber Security", org: "Anna University, Chennai", avatar: "MA" },
  { name: "Dr. Harish Ramani", role: "Professor", org: "IIT Madras Chennai", avatar: "HR" },
  { name: "Ms. Shahnaz Illyas, IPS", role: "SP, Cyber Crime Wing", org: "Tamil Nadu", avatar: "SI" },
  { name: "Dr. Jayakumar Vaithiyashankar", role: "Founder and CEO", org: "Anuthantra Pvt. Ltd.", avatar: "JV" },
  { name: "Dr. Vishnu Priya", role: "Assistant Professor", org: "NIT, TRICHY", avatar: "VP" },
  { name: "Dr. M. Subramani", role: "Assistant Professor", org: "IIITDM, Kancheepuram", avatar: "MS" },
  { name: "Mr. Mohammed Tousif", role: "Founder and CEO", org: "Cynux Era", avatar: "MT" },
];

// First 6 in a 3-col grid, last 2 centered separately
const mainSpeakers = speakers.slice(0, 6);
const lastSpeakers = speakers.slice(6);

const SpeakerCard = ({ speaker, i, isInView }: { speaker: typeof speakers[0]; i: number; isInView: boolean }) => (
  <motion.div
    key={speaker.name}
    initial={{ opacity: 0, y: 40 }}
    animate={isInView ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.6, delay: 0.1 * i }}
    className="gold-border rounded-xl p-8 bg-card/30 backdrop-blur-sm text-center group hover:bg-card/60 transition-all duration-300"
  >
    <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-6 group-hover:border-primary/60 group-hover:shadow-[var(--shadow-gold)] transition-all duration-300">
      <span className="font-heading text-xl font-extrabold text-primary">
        {speaker.avatar}
      </span>
    </div>
    <h3 className="font-heading text-lg font-bold mb-1">{speaker.name}</h3>
    <p className="font-mono text-xs text-primary mb-2">{speaker.role}</p>
    <p className="text-muted-foreground text-sm">{speaker.org}</p>
  </motion.div>
);

const SpeakersSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="speakers" className="py-24 relative">
      <div className="section-divider mb-24" />
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-primary uppercase tracking-[0.3em]">
            // Featured Speakers
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-extrabold mt-4">
            Industry <span className="text-gradient-gold">Experts</span>
          </h2>
        </motion.div>

        {/* First 6 speakers — full 3-col grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainSpeakers.map((speaker, i) => (
            <SpeakerCard key={speaker.name} speaker={speaker} i={i} isInView={isInView} />
          ))}
        </div>

        {/* Last 2 speakers — centered row */}
        <div className="flex justify-center gap-8 mt-8 flex-wrap">
          {lastSpeakers.map((speaker, i) => (
            <div key={speaker.name} className="w-full sm:w-[calc(33.333%-1rem)]">
              <SpeakerCard speaker={speaker} i={mainSpeakers.length + i} isInView={isInView} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpeakersSection;