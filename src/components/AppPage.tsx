"use client"
import Hero from "./Hero"
import Tokenomics from "./Tokenomics"
import Faqs from "./Faqs"
// import Navigation from "./navigation"
import BackgroundElements from "./background-elements"
import { Twitter, Send } from "lucide-react"
import TwitterFeed from "./XFeed"
import BoxBoxInterface from "./BoxBoxInterface"
import { useMemo, useEffect, useState } from "react"
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react"
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base"
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from "@solana/wallet-adapter-wallets"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
// import BoxBoxInterface from "./components/BoxBoxInterface"
import Loader from "./Loader"

import "@solana/wallet-adapter-react-ui/styles.css"

// Moved outside the main component
function WalletChangeListener() {
  const { publicKey } = useWallet()

  useEffect(() => {
    const currentWallet = publicKey?.toBase58()
    const previousWallet = sessionStorage.getItem("previousWallet")

    if (currentWallet && previousWallet && previousWallet !== currentWallet) {
      sessionStorage.setItem("previousWallet", currentWallet)
      window.location.href = window.location.href
    } else if (currentWallet) {
      sessionStorage.setItem("previousWallet", currentWallet)
    }
  }, [publicKey])

  return null
}

// Wallet context wrapper component
function WalletContextWrapper({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => clusterApiUrl(network), [network])
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network }), new TorusWalletAdapter()],
    [network],
  )

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletChangeListener />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading process
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000) // Adjust this value to control how long the loader is shown

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <Loader />
  }

  return (
    <WalletContextWrapper>
      <div className="relative min-h-screen text-white font-sans overflow-hidden">
        <BackgroundElements />

        <main className="relative z-10">
          <section id="hero" className="mb-8 sm:mb-16">
            <Hero />
          </section>

          <div className="relative z-10 border-t-2 border-yellow-500/50 py-4 sm:py-8 mt-8 sm:mt-16" />

          <section id="interface" className="backdrop-blur-xs">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-yellow-500 bg-clip-text text-transparent mb-4 py-3">
                    BoxBox Web3 Memebership
                  </h2>
                  <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Lock your BOXBOX tokens to participate in the F1 community and earn rewards.
                  </p>
                </div>
                
                {/* <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-yellow-500/20 p-6 shadow-xl shadow-black/20"> */}
                  <BoxBoxInterface />
                {/* </div> */}
              </div>
            </div>
          </section>

          <div className="relative z-10 border-t-2 border-yellow-500/50 py-8 mt-16" />

          <section id="twitter-feed" className="py-16 md:py-16">
            <TwitterFeed />
          </section>

          <div className="relative z-10 border-t-2 border-yellow-500/50 py-8 mt-16" />

          <section id="tokenomics" className="py-16 md:py-16">
            <Tokenomics />
          </section>

          <div className="relative z-10 border-t-2 border-yellow-500/50 py-8 mt-16" />

          <section id="faqs" className="py-16 md:py-16 z-100">
            <Faqs />
          </section>

          {/* <div className="w-full border-t-2 border-yellow-500/50 my-8" /> */}
        </main>

        <footer className="relative z-10 border-t-2 border-yellow-500/50 py-4 sm:py-8 mt-8 sm:mt-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
                
                <div className="flex gap-6 justify-center items-center w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏎️</span>
                    <span className="font-bold text-yellow-500">BOXBOX</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <a href="https://x.com/F1memeBoxbox" className="text-gray-400 hover:text-yellow-500 transition-colors">
                      <Twitter size={20} />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-yellow-500 transition-colors">
                      <Send size={20} />
                    </a>
                    <a href="https://solscan.io/token/A5D4sQ3gWgM7QHFRyo3ZavKa9jMjkfHSNR6rX5TNJB8y" className="text-gray-400 hover:text-yellow-500 transition-colors">
                      Solscan
                    </a>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                &copy; {new Date().getFullYear()} F1 Meme. All rights reserved.
              </p>

              <p className="text-[12px] text-gray-400 max-w-3xl text-center px-4">
                This is a meme project which is unofficial and is not associated in any way with the Formula 1 companies. 
                F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks 
                of Formula One Licensing B.V
              </p>
            </div>
          </div>
        </footer>
      </div>
    </WalletContextWrapper>
  )
}

