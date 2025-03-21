"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Info, Copy, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"

interface TokenDetails {
  address: string
  totalSupply: string
  name: string
  symbol: string
  price: string
  volume24h: string
  liquidity: string
  marketCap: string
  priceChange24h: string
  transactions24h: {
    buys: number
    sells: number
  }
}

export default function Tokenomics() {
  const [tokenDetails, setTokenDetails] = useState<TokenDetails>({
    address: "A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y",
    totalSupply: "-",
    name: "F1 Meme",
    symbol: "BOXBOX",
    price: "-",
    volume24h: "-",
    liquidity: "-",
    marketCap: "-",
    priceChange24h: "-",
    transactions24h: {
      buys: 0,
      sells: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem('tokenData')
        const cachedTimestamp = localStorage.getItem('tokenDataTimestamp')
        
        const now = Date.now()
        const cacheAge = cachedTimestamp ? now - parseInt(cachedTimestamp) : Infinity
        const CACHE_DURATION = 60000 // 1 minute in milliseconds

        // Use cached data if it's fresh
        if (cachedData && cacheAge < CACHE_DURATION) {
          const pair = JSON.parse(cachedData)
          updateTokenDetails(pair)
          setLoading(false)
          return
        }

        // Fetch fresh data if cache is stale or missing
        const response = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/tokens/A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y`,
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        )
        const data = await response.json()

        if (data.data) {
          // Get pool data for additional metrics
          const poolsResponse = await fetch(
            `https://api.geckoterminal.com/api/v2/networks/solana/tokens/A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y/pools`,
            {
              headers: {
                'Accept': 'application/json'
              }
            }
          )
          const poolsData = await poolsResponse.json()
          
          const tokenData = {
            ...data.data,
            pools: poolsData.data
          }

          // Update cache
          localStorage.setItem('tokenData', JSON.stringify(tokenData))
          localStorage.setItem('tokenDataTimestamp', now.toString())
          updateTokenDetails(tokenData)
        }
      } catch (err) {
        setError("Failed to fetch token data")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    // Helper function to update token details
    const updateTokenDetails = (tokenData: any) => {
      // Get the attributes from the response
      const attributes = tokenData.attributes || {}
      
      setTokenDetails(prev => ({
        ...prev,
        address: attributes.address || prev.address,
        name: attributes.name || prev.name,
        symbol: attributes.symbol || prev.symbol,
        price: attributes.price_usd ? 
          `$${Number(attributes.price_usd).toFixed(8)}` : '-',
        volume24h: attributes.volume_usd?.h24 ? 
          `$${Number(attributes.volume_usd.h24).toLocaleString()}` : '-',
        liquidity: attributes.total_reserve_in_usd ? 
          `$${Number(attributes.total_reserve_in_usd).toLocaleString()}` : '-',
        marketCap: attributes.fdv_usd ? 
          `$${Number(attributes.fdv_usd).toLocaleString()}` : '-',
        totalSupply: attributes.total_supply ? 
          Number(attributes.total_supply).toLocaleString() : '-',
        // Since price change is not in the API response, keeping it as is
        priceChange24h: '-',
        transactions24h: {
          buys: 0,  // These values aren't available in the basic token response
          sells: 0
        }
      }))
    }

    // Initial fetch
    fetchTokenData()

    // Set up interval to fetch every minute
    const interval = setInterval(fetchTokenData, 60000)

    // Cleanup interval on component unmount
    return () => clearInterval(interval)
  }, [])

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
        className="text-center mb-16 relative z-10"
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
              {error ? (
                <div className="text-red-500 text-center">{error}</div>
              ) : loading ? (
                <div className="text-gray-400 text-center">Loading token details...</div>
              ) : (
                <>
                  {/* <h3 className="text-2xl sm:text-3xl font-bold text-white mb-6">Token details</h3> */}
                  <motion.div variants={container} initial="hidden" whileInView="show" 
                    viewport={{ once: true, margin: "-100px" }} className="space-y-4 sm:space-y-6">
                    <motion.div
                      variants={item}
                      className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-y-3 sm:gap-y-4 border border-gray-700/50 rounded-lg overflow-hidden"
                    >
                      <div className="text-gray-400 p-3 backdrop-blur-sm bg-black/20 text-sm sm:text-base">Address</div>
                      <div className="group flex items-center text-white font-mono text-xs sm:text-sm break-all p-3 backdrop-blur-sm bg-black/10">
                        {tokenDetails.address}
                        <button
                          onClick={() => copyToClipboard(tokenDetails.address)}
                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                        >
                          <Copy size={14} className={`${copied ? "text-green-500" : "text-gray-400 hover:text-white"}`} />
                        </button>
                      </div>
                    </motion.div>

                    <motion.div variants={item}>
                      <div className="flex flex-col sm:grid sm:grid-cols-[140px_1fr] gap-y-3 sm:gap-y-4 border border-gray-700/50 rounded-lg overflow-hidden">
                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">Total Supply</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.totalSupply}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">Name(Symbol)</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.name}
                          <span className="text-gray-400">{tokenDetails.symbol}</span>
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">Token Price</div>
                        <div className="text-yellow-500 p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.price}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">24h Volume</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.volume24h}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">Liquidity</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.liquidity}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">Market Cap</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          {tokenDetails.marketCap}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">24h Change</div>
                        <div className={`p-3 bg-gray-800/30 flex items-center gap-2 ${
                          parseFloat(tokenDetails.priceChange24h) > 0 ? 'text-green-500' : 'text-red-500'
                        } text-sm sm:text-base`}>
                          {tokenDetails.priceChange24h}
                        </div>

                        <div className="text-gray-400 p-3 bg-gray-800/50 text-sm sm:text-base">24h Trades</div>
                        <div className="text-white p-3 bg-gray-800/30 flex items-center gap-2 text-sm sm:text-base">
                          <span className="text-green-500">↑{tokenDetails.transactions24h.buys}</span>
                          <span className="text-red-500">↓{tokenDetails.transactions24h.sells}</span>
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
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}