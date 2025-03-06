"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const RacingCars = () => {
  const [cars, setCars] = useState<Array<{ id: number; delay: number; y: number }>>([])

  useEffect(() => {
    // Create 5 cars with random positions and delays
    const newCars = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      y: Math.random() * window.innerHeight
    }))
    setCars(newCars)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {cars.map((car) => (
        <motion.div
          key={car.id}
          initial={{ x: -100, y: car.y }}
          animate={{
            x: [window.innerWidth + 100],
            y: [car.y - 50, car.y + 50, car.y]
          }}
          transition={{
            x: {
              duration: 15,
              repeat: Infinity,
              delay: car.delay,
              ease: "linear"
            },
            y: {
              duration: 8,
              repeat: Infinity,
              delay: car.delay,
              ease: "easeInOut"
            }
          }}
          className="absolute text-4xl opacity-5"
        >
          🏎️
        </motion.div>
      ))}
    </div>
  )
}

export default RacingCars 