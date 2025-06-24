import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Github, Linkedin, Twitter } from 'lucide-react';
import charlesImage from '../../assests/WhatsApp Image 2025-04-03 at 15.53.00_5192c7e5.jpg';
import kerrenImage from '../../assests/kereen.png';

const teamMembers = [
  {
    name: 'Charles Chyna',
    title: 'Lead Developer & AI Architect',
    imageUrl: charlesImage,
    socials: {
      github: '#',
      linkedin: '#',
      twitter: '#',
    },
  },
  {
    name: ' Kerren Hapuch',
    title: 'Data Scientist & AI Engineer',
    imageUrl: kerrenImage,
    socials: {
      github: '#',
      linkedin: '#',
      twitter: '#',
    },
  },
];

const cardVariants: Variants = {
  offscreen: {
    y: 50,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
};

const TeamSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
        >
          Meet the Team
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
        >
          The minds behind the innovation. We are a passionate duo dedicated to revolutionizing urban mobility through technology.
        </motion.p>
        <div className="flex flex-wrap justify-center gap-10">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4"
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-500 hover:scale-105 hover:shadow-2xl">
                <div className="h-56 w-full overflow-hidden">
                  <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover object-center" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-primary-500 font-medium">{member.title}</p>
                  <div className="mt-4 flex justify-center space-x-4">
                    <a href={member.socials.github} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"><Github /></a>
                    <a href={member.socials.linkedin} className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Linkedin /></a>
                    <a href={member.socials.twitter} className="text-gray-500 hover:text-sky-500 dark:hover:text-sky-400 transition-colors"><Twitter /></a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
