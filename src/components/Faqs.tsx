"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Card, CardContent } from "./ui/card"

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "What is a Solana Token Program?",
      answer:
        "A Solana Token Program is a smart contract that manages the creation and behavior of tokens on the Solana blockchain. It handles essential functions such as minting new tokens, burning existing ones, and facilitating transfers between accounts. This program ensures the integrity and functionality of tokens within the Solana ecosystem.",
    },
    {
      question: "What is a Membership Account?",
      answer:
        "A Membership Account is a specialized account within our ecosystem that tracks your participation and privileges. It stores information about your activity, token holdings, and access levels. This account may grant you special benefits, voting rights, or access to exclusive features based on your level of engagement and token ownership.",
    },
    {
      question: "What is a Vault?",
      answer:
        "A Vault is a secure smart contract designed to hold and manage tokens or other digital assets. Vaults serve various purposes, such as facilitating staking mechanisms, providing liquidity to decentralized exchanges, or managing treasury funds. They often incorporate advanced security measures to protect the assets they hold.",
    },
    {
      question: "How are tokens locked and unlocked?",
      answer:
        "Token locking and unlocking are controlled by smart contract mechanisms. These processes can be used for various purposes, such as implementing vesting schedules for team tokens, enforcing staking periods, or managing liquidity. The smart contract defines conditions that must be met before tokens can be transferred or accessed, ensuring adherence to predefined rules.",
    },
    {
      question: "What is Level 0?",
      answer:
        "Level 0 is the entry-level status for new accounts in our ecosystem. At this level, users have access to basic features and functionalities. It serves as a starting point for users to familiarize themselves with the platform and begin their journey towards higher membership tiers.",
    },
    {
      question: "What is Level 1?",
      answer:
        "Level 1 is an elevated membership tier that offers enhanced benefits compared to Level 0. Users at this level may enjoy perks such as reduced fees, increased voting power, or access to exclusive content. Advancing to Level 1 typically requires meeting certain criteria, such as holding a specific amount of tokens or participating in platform activities.",
    },
    {
      question: "What is Level 99?",
      answer:
        "Level 99 represents the pinnacle of membership within our ecosystem. This elite tier is reserved for the most dedicated and engaged users. Members at Level 99 enjoy premium features, maximum benefits, and potentially significant influence within the community. Achieving this level often requires substantial token holdings, long-term participation, or outstanding contributions to the ecosystem.",
    },
  ]

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
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8 sm:mb-16 relative z-10"
      >
        <h2 className="text-4xl sm:text-5xl font-bold text-yellow-500 mb-4">FAQ</h2>
        <p className="text-gray-400 max-w-2xl mx-auto px-4">
          Frequently Asked Questions
        </p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-3 sm:space-y-4"
      >
        {faqs.map((faq, index) => (
          <motion.div key={index} variants={item} className="overflow-hidden">
            <Card className="bg-[#00000066] backdrop-blur-sm border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-6 hover:bg-yellow-500/5 transition-colors duration-200 focus:outline-none"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-yellow-400">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-yellow-400 transition-transform duration-300 ${
                      openIndex === index ? "transform rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-yellow-500/5"
                  >
                    <CardContent className="p-6 pt-2 text-gray-300 leading-relaxed border-t border-yellow-500/10">
                      {faq.answer}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="mt-16 text-center"
      >
        <Card className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 backdrop-blur-sm border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 max-w-2xl mx-auto">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
            <p className="text-gray-300 mb-6">
              Join our community channels to get more information and stay updated on the latest developments.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://x.com/F1memeBoxbox"
                className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors duration-300 flex items-center gap-2"
              >
                <span>Twitter</span>
              </a>
              <a
                href="#"
                className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors duration-300 flex items-center gap-2"
              >
                <span>Telegram</span>
              </a>
              <a
                href="#"
                className="px-6 py-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors duration-300 flex items-center gap-2"
              >
                <span>Youtube</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

