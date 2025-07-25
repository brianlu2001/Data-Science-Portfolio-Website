import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, Linkedin } from "lucide-react";
import { SiteSettings } from "@shared/schema";

interface ContactSectionProps {
  siteSettings?: SiteSettings;
}

export default function ContactSection({ siteSettings }: ContactSectionProps) {
  const defaultSettings = {
    contactEmail: "brian901231@gmail.com",
    contactPhone: "8056897961",
    linkedinUrl: "https://www.linkedin.com/in/kuan-i-lu/",
  };

  const settings = siteSettings || defaultSettings;

  return (
    <section className="container mx-auto px-4 sm:px-6 py-16 relative z-0">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="suika-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4 text-white"
        >
          Get In Touch
        </motion.h2>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-24 h-1 bg-royal-500 mx-auto rounded-full mb-12"
        ></motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="glass-effect border-gray-600 text-center hover:bg-royal-500 hover:bg-opacity-10 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="text-royal-400 mb-4 group-hover:text-royal-300 transition-colors">
                  <Mail className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Email</h3>
                <p className="text-gray-300 mb-2">
                  {settings.contactEmail}
                </p>
                <p className="text-gray-300">
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="hover:text-royal-400 transition-colors"
                  >
                    Send an Email
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-effect border-gray-600 text-center hover:bg-royal-500 hover:bg-opacity-10 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="text-royal-400 mb-4 group-hover:text-royal-300 transition-colors">
                  <Phone className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2 text-white">Phone</h3>
                <p className="text-gray-300 mb-2">
                  {settings.contactPhone ? 
                    `(${settings.contactPhone.slice(0,3)}) ${settings.contactPhone.slice(3,6)}-${settings.contactPhone.slice(6)}` : 
                    settings.contactPhone
                  }
                </p>
                <p className="text-gray-300">
                  <a
                    href={`tel:+1${settings.contactPhone}`}
                    className="hover:text-royal-400 transition-colors"
                  >
                    Call Number
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="glass-effect border-gray-600 text-center hover:bg-royal-500 hover:bg-opacity-10 transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="text-royal-400 mb-4 group-hover:text-royal-300 transition-colors">
                  <Linkedin className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold mb-2 text-white">LinkedIn</h3>
                <p className="text-gray-300 mb-2">
                  Connect with me
                </p>
                <p className="text-gray-300">
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-royal-400 transition-colors"
                  >
                    View Profile
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
