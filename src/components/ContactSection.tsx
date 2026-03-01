import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, MapPin, Phone } from "lucide-react";

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="py-24 relative">
      <div className="section-divider mb-24" />
      <div className="container mx-auto px-6" ref={ref}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-primary uppercase tracking-[0.3em]">
            // Get in Touch
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-extrabold mt-4">
            Contact <span className="text-gradient-gold">Us</span>
          </h2>
        </motion.div>

        {/* Two info cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-10">

          {/* Event Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="gold-border rounded-2xl p-8 bg-card/30 backdrop-blur-sm"
          >
            <h3 className="font-heading text-xl font-extrabold text-primary mb-6">
              Event Information
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-bold text-primary">Date</span>
                </div>
                <p className="text-foreground/80 text-sm pl-6">10–11 March 2026</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-bold text-primary">Location</span>
                </div>
                <p className="text-foreground/80 text-sm pl-6 leading-relaxed">
                  National Forensics Science University<br />
                  Chennai Campus
                </p>
              </div>
            </div>
          </motion.div>

          {/* Organizing Committee */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="gold-border rounded-2xl p-8 bg-card/30 backdrop-blur-sm"
          >
            <h3 className="font-heading text-xl font-extrabold text-primary mb-6">
              Organizing Committee
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-bold text-primary">For Queries</span>
                </div>
                <div className="space-y-1 pl-6">
                  <p className="text-foreground/80 text-sm">Moksh Grover — +91-98765 43210</p>
                  <p className="text-foreground/80 text-sm">Herrin Shah — +91-98765 43211</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-heading text-sm font-bold text-primary">Registration Support</span>
                </div>
                <div className="pl-6">
                  <p className="text-foreground/80 text-sm">Sai Charan — +91-98765 43212</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Google Maps embed */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="max-w-4xl mx-auto"
        >
          <div className="gold-border rounded-2xl overflow-hidden" style={{ height: "380px" }}>
            <iframe
              title="NFSU Chennai Campus Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.3270610063674!2d80.14970997507782!3d13.049985787249556!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5267c3e3b70001%3A0x8df8a0b0e7d0a3b6!2sNational%20Forensic%20Sciences%20University%2C%20Chennai%20Campus!5e0!3m2!1sen!2sin!4v1709051200000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) saturate(0.8) brightness(0.85)" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="text-center mt-3 text-xs text-muted-foreground font-mono">
            <a
              href="https://maps.app.goo.gl/7U9ikj9TAMBjHZDXA"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              📍 View on Google Maps →
            </a>
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default ContactSection;
