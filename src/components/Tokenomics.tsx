"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Info, Copy, ChevronDown } from "lucide-react"
import { useState } from "react"

interface TokenDetails {
  address: string
  totalSupply: string
  burnt: string
  name: string
  symbol: string
  price: string
}

const tokenDetails: TokenDetails = {
  address: "A5D4sQ...TNJB8y",
  totalSupply: "135,829,261,759.33",
  burnt: "1,029,000",
  name: "F1 Meme",
  symbol: "BOXBOX",
  price: "$0.064807",
}

export default function Tokenomics() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="container mx-auto px-4 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h2 className="text-5xl font-bold text-yellow-500 mb-4">Tokenomics</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Discover the economic model behind BOXBOX, the F1 Meme token powering our ecosystem
        </p>
      </motion.div>

      <div className="grid md:grid-cols-1 gap-8 lg:gap-16 items-start max-w-2xl mx-auto">
        <motion.div>
          <Card className="backdrop-blur-sm border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">Token details</h3>

              <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-100px" }}
                className="space-y-4 sm:space-y-6"
              >
                <motion.div
                  variants={item}
                  className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-y-3 sm:gap-y-4 border border-gray-700/50 rounded-lg overflow-hidden"
                >
                  <div className="text-gray-400 p-3 backdrop-blur-sm bg-black/20">Address</div>
                  <div className="group flex items-center text-white font-mono break-all p-3 backdrop-blur-sm bg-black/10">
                    {tokenDetails.address}
                    <button
                      onClick={() => copyToClipboard("A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y")}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                    >
                      <Copy size={16} className={`${copied ? "text-green-500" : "text-gray-400 hover:text-white"}`} />
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={item}>
                  <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[140px_1fr] gap-y-3 sm:gap-y-4 border border-gray-700/50 rounded-lg overflow-hidden">
                    <div className="text-gray-400 p-3 bg-gray-800/50">Total Supply</div>
                    <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2">
                      {tokenDetails.totalSupply}
                    </div>

                    <div className="text-gray-400 p-3 bg-gray-800/50">Burnt</div>
                    <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2">
                      {tokenDetails.burnt}
                      <span className="text-gray-400">{tokenDetails.symbol}</span>
                    </div>

                    <div className="text-gray-400 p-3 bg-gray-800/50">Name(Symbol)</div>
                    <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2">
                      {tokenDetails.name}
                      <span className="text-gray-400">{tokenDetails.symbol}</span>
                    </div>

                    <div className="text-gray-400 p-3 bg-gray-800/50">Token Price</div>
                    <div className="text-yellow-500 p-3 bg-gray-800/30 flex items-center gap-2">
                      {tokenDetails.price}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={item}
                  className="mt-8 flex items-start gap-3 text-gray-400 bg-black/40 p-4 rounded-lg border border-white/10"
                >
                  <Info className="flex-shrink-0 mt-1" size={20} />
                  <p className="text-sm">
                    Currently the Liquidity is very low, if you have trouble buying large amount of BOXBOX tokens,
                    please consider doing multiple swap in smaller amount.
                  </p>
                </motion.div>

                <motion.div variants={item}>
                  <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-500/80 text-black font-bold py-4 rounded-full mt-6 transition-all duration-300"
                    size="lg"
                  >
                    SWAP NOW
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        
      </div>

    </div>
  )
}
