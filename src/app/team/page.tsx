"use client";

import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const team = [
  {
    name: "Alex Chen",
    role: "Founder & CEO",
    bio: "Former health tech lead at Google. Passionate about making personalized health accessible to everyone.",
    image: "/team/alex.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "Sarah Martinez",
    role: "Chief Medical Officer",
    bio: "MD from Stanford, 15 years in preventive medicine. Ensures Delta's guidance is medically sound.",
    image: "/team/sarah.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "James Wright",
    role: "Head of AI",
    bio: "PhD in Machine Learning from MIT. Previously built recommendation systems at Spotify.",
    image: "/team/james.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "Emily Park",
    role: "Head of Product",
    bio: "Product leader with 10+ years at Apple and Peloton. Obsessed with delightful user experiences.",
    image: "/team/emily.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "Michael Torres",
    role: "Head of Engineering",
    bio: "Built scalable systems at Netflix and Stripe. Loves solving hard infrastructure problems.",
    image: "/team/michael.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
  {
    name: "Lisa Wang",
    role: "Head of Design",
    bio: "Former design lead at Airbnb. Believes great design should feel invisible.",
    image: "/team/lisa.jpg",
    socials: { twitter: "#", linkedin: "#" },
  },
];

const values = [
  {
    title: "User First",
    description: "Every decision we make starts with how it impacts the people we serve.",
  },
  {
    title: "Science-Backed",
    description: "We ground our guidance in peer-reviewed research and medical expertise.",
  },
  {
    title: "Privacy by Design",
    description: "Your health data is sacred. We build with privacy as a core principle.",
  },
  {
    title: "Continuous Learning",
    description: "We're always improving, both as a product and as individuals.",
  },
];

export default function TeamPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto px-8 mb-20"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-primary font-medium text-sm tracking-wider uppercase"
          >
            Our Team
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold mt-4 mb-6"
          >
            Meet the People
            <br />
            <span className="text-primary">Behind Delta</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted text-lg"
          >
            We're a diverse team of engineers, designers, doctors, and dreamers united by a
            mission to make health guidance personal and accessible.
          </motion.p>
        </motion.div>

        {/* Team grid */}
        <div className="max-w-6xl mx-auto px-8 mb-32">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="group p-6 bg-card rounded-3xl border border-border hover:border-primary/30 transition-colors"
              >
                {/* Avatar placeholder */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6"
                >
                  <span className="text-3xl font-bold text-primary">
                    {member.name.split(" ").map(n => n[0]).join("")}
                  </span>
                </motion.div>

                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-3">{member.role}</p>
                <p className="text-muted text-sm mb-4">{member.bio}</p>

                {/* Social links */}
                <div className="flex gap-3">
                  <motion.a
                    href={member.socials.twitter}
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </motion.a>
                  <motion.a
                    href={member.socials.linkedin}
                    whileHover={{ scale: 1.1 }}
                    className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Values section */}
        <div className="max-w-6xl mx-auto px-8 mb-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center mb-12"
          >
            Our Values
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 bg-card rounded-2xl border border-border"
              >
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-muted text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Join us CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto px-8 text-center"
        >
          <div className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl border border-primary/20">
            <h2 className="text-3xl font-bold mb-4">Join Our Team</h2>
            <p className="text-muted mb-8">
              We're always looking for talented people who share our mission.
              Check out our open positions.
            </p>
            <motion.a
              href="#"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block px-8 py-3 bg-primary text-white rounded-full font-medium"
            >
              View Open Roles
            </motion.a>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
