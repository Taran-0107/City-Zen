import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Sphere, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Droplets, Lightbulb, Recycle, Building, TreePine } from 'lucide-react';
import ecocityLogo from '/lovable-uploads/431a9761-d0ee-4182-942a-47378d8f2f86.png';

// Gentle 3D Background Elements
function FloatingElements() {
  const groupRef = useRef<any>();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      <Sphere position={[-6, 3, 0]} args={[0.5]}>
        <meshStandardMaterial color="#28a745" emissive="#28a745" emissiveIntensity={0.1} />
      </Sphere>
      <Torus position={[6, -2, 2]} args={[0.8, 0.3]}>
        <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.1} />
      </Torus>
      <Box position={[0, 4, -3]} args={[0.6, 0.6, 0.6]}>
        <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={0.1} />
      </Box>
    </group>
  );
}


const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("Initializing Platform...");

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 35);

    // Update loading text based on progress
    const textInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 25) setCurrentText("Loading Eco-Systems...");
        else if (prev < 50) setCurrentText("Connecting Communities...");
        else if (prev < 75) setCurrentText("Initializing Sustainability Tracker...");
        else if (prev < 95) setCurrentText("Building Greener Cities...");
        else setCurrentText("Welcome to the Future!");
        return prev;
      });
    }, 1000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
    };
  }, []);


  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center overflow-hidden">
      {/* Subtle 3D Scene */}
      <div className="absolute inset-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.3} />
          <FloatingElements />
        </Canvas>
      </div>

      {/* Loading Content */}
      <div className="relative z-10 text-center px-8 max-w-2xl">
        {/* Logo and Title */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-12"
        >
          {/* Main Logo */}
          <div className="flex justify-center items-center mb-8">
            <motion.div 
              className="relative"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <img 
                src={ecocityLogo} 
                alt="CITY-ZEN Platform Logo" 
                className="w-32 h-32 object-contain drop-shadow-2xl"
              />
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            CITY-ZEN
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            Smarter, Safer, and Greener Cities Together
          </p>
        </motion.div>

        {/* Progress Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="space-y-8"
        >
          {/* Loading Text */}
          <motion.p 
            className="text-lg font-medium text-muted-foreground"
            key={currentText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {currentText}
          </motion.p>

          {/* Progress Bar */}
          <div className="w-full max-w-sm mx-auto">
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <p className="text-sm mt-3 text-muted-foreground/80">{progress}% Complete</p>
          </div>

          {/* Gentle loading dots */}
          <motion.div
            className="flex justify-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary/60 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;