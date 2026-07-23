import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AlertTriangle, BarChart3, Users, Leaf, TreePine, Recycle, Droplets, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navigation from '@/components/Navigation';

// Simplified 3D Background Component
function FloatingElements() {
  const groupRef = useRef<any>();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -8]}>
      {/* Minimal floating eco elements */}
      <Sphere position={[-4, 2, 0]} args={[0.4]}>
        <meshStandardMaterial color="#28a745" emissive="#28a745" emissiveIntensity={0.1} />
      </Sphere>
      <Torus position={[4, -1, 2]} args={[0.6, 0.2]}>
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.1} />
      </Torus>
      <Box position={[0, 3, -2]} args={[0.5, 0.5, 0.5]}>
        <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={0.1} />
      </Box>
    </group>
  );
}

const Index = () => {
  const features = [
    {
      icon: AlertTriangle,
      title: "Report Issues",
      description: "Submit civic issues with photo verification and community validation.",
      link: "/report"
    },
    {
      icon: BarChart3,
      title: "Track Impact",
      description: "Monitor your sustainability metrics and environmental progress.",
      link: "/sustainability"
    },
    {
      icon: Users,
      title: "Build Community",
      description: "Connect with neighbors and collaborate on local initiatives.",
      link: "/community"
    },
    {
      icon: Trophy,
      title: "Earn Rewards",
      description: "Get recognized for your civic contributions and achievements.",
      link: "/rewards"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Subtle 3D Background */}
        <div className="absolute inset-0 opacity-40">
          <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.4} />
            <FloatingElements />
          </Canvas>
        </div>

        {/* Minimal floating particles */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/60 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 10,
                opacity: 0
              }}
              animate={{ 
                y: -10,
                opacity: [0, 0.6, 0]
              }}
              transition={{
                duration: Math.random() * 8 + 6,
                repeat: Infinity,
                delay: Math.random() * 8
              }}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="space-y-12"
          >
            {/* Main Headline */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gradient-hero leading-[0.9]">
                Smarter Cities,<br />
                <span className="text-gradient-eco">Greener Future</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
                Empower your community through civic engagement, sustainability tracking, 
                and collaborative problem-solving. Together, we build better cities.
              </p>
            </div>

            {/* Primary Actions */}
            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link to="/report">
                <Button size="lg" className="btn-eco text-lg px-12 py-5 min-w-[220px] font-semibold">
                  Start Reporting
                </Button>
              </Link>
              <Link to="/community">
                <Button size="lg" variant="outline" className="text-lg px-12 py-5 min-w-[220px] font-semibold border-primary/30 hover:border-primary hover:bg-primary/10">
                  Join Community
                </Button>
              </Link>
            </motion.div>

            {/* Key Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto pt-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {[
                { value: "50K+", label: "Active Citizens" },
                { value: "2.5K", label: "Issues Resolved" },
                { value: "85%", label: "Satisfaction Rate" },
                { value: "12", label: "Partner Cities" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="text-center p-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-3">{stat.value}</div>
                  <div className="text-sm md:text-base text-muted-foreground font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-eco">
              Everything you need for civic engagement
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed to make community participation simple and impactful
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={feature.link}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="cursor-pointer h-full border-0 bg-card/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <feature.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
        <div className="max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex justify-center">
              <motion.div
                className="p-4 bg-gradient-primary rounded-2xl"
                animate={{ 
                  scale: [1, 1.05, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Leaf className="w-10 h-10 text-white" />
              </motion.div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gradient-hero">
                Building Tomorrow's Cities Today
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                We believe in the power of collective action. Our platform connects citizens, 
                local governments, and communities to create sustainable, livable cities for everyone.
              </p>
            </div>
            
            <div className="flex justify-center space-x-12 pt-8">
              {[
                { icon: Recycle, label: "Sustainability" },
                { icon: Droplets, label: "Conservation" },
                { icon: TreePine, label: "Green Spaces" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex flex-col items-center space-y-2"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;