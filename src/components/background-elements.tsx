"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

const RacingCar = ({ delay, duration, yPosition }: { delay: number; duration: number; yPosition: string }) => (
  <motion.div
    className="absolute text-6xl racing-car" // Increased font size
    initial={{ x: "-100%" }}
    animate={{ x: "100vw" }}
    transition={{
      duration: duration,
      repeat: Infinity,
      ease: "linear",
      delay: delay,
    }}
    style={{ top: yPosition }}
  >
    <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🏎️</span>
  </motion.div>
)

export default function BackgroundElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight * 3 // Make canvas taller to cover all sections
    }
    
    setCanvasDimensions()
    window.addEventListener('resize', setCanvasDimensions)
    
    // Create particles
    const particles: {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number
      color: string
    }[] = []
    
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.8 ? '#EAB308' : '#FFFFFF'
      })
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Draw particles
      particles.forEach(particle => {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()
        
        // Update position
        particle.x += particle.speedX
        particle.y += particle.speedY
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions)
    }
  }, [])
  
  return (
    <>
      <canvas 
        ref={canvasRef} 
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{ opacity: 1 }}
      />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          initial={{ opacity: 0.15 }}
          animate={{ opacity: 0.15 }}
          className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-yellow-500 rounded-full blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0.1 }}
          animate={{ opacity: 0.1 }}
          className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-yellow-500 rounded-full blur-[150px]"
        />
        <motion.div
          initial={{ opacity: 0.05 }}
          animate={{ opacity: 0.05 }}
          className="absolute top-1/3 right-0 w-1/3 h-1/3 bg-blue-500 rounded-full blur-[150px]"
        />
        
        {/* Racing Cars */}
        <RacingCar delay={0} duration={8} yPosition="20%" />
        <RacingCar delay={2} duration={10} yPosition="40%" />
        <RacingCar delay={4} duration={12} yPosition="60%" />
        <RacingCar delay={1} duration={9} yPosition="80%" />
        <RacingCar delay={3} duration={11} yPosition="90%" />
      </div>
    </>
  )
}
