"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ChevronRight, Trophy, Clock } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import DriversStandings from "./DriversStandings"
// import Link from "next/link"

interface Driver {
  givenName: string
  familyName: string
  code: string
}

interface Constructor {
  name: string
  constructorId: string
}

interface RaceResult {
  position: string
  Driver: Driver
  Constructor: Constructor
}

interface RaceResults {
  raceName: string
  Results: RaceResult[]
}

interface NextRaceInfo {
  date: string
  time: string
  raceName: string
  circuit: string
}

interface SeasonInfo {
  isActive: boolean
  currentYear: number
  nextSeasonStart?: string
  lastRaceDate?: string
}

interface CachedData {
  data: any;
  timestamp: number;
}

export default function Hero() {
  const [previousRace, setPreviousRace] = useState<RaceResults>({
    raceName: "2024 Championship Standings",
    Results: [
      {
        position: "1",
        Driver: {
          givenName: "Max",
          familyName: "Verstappen",
          code: "VER"
        },
        Constructor: {
          name: "Red Bull Racing",
          constructorId: "red_bull"
        }
      },
      {
        position: "2",
        Driver: {
          givenName: "Lando",
          familyName: "Norris",
          code: "NOR"
        },
        Constructor: {
          name: "McLaren Mercedes",
          constructorId: "mcLaren_mercedes"
        }
      },
      {
        position: "3",
        Driver: {
          givenName: "Charles",
          familyName: "Leclerc",
          code: "LEC"
        },
        Constructor: {
          name: "Ferrari",
          constructorId: "ferrari"
        }
      }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [newsItems, setNewsItems] = useState<string[]>([
    "Yuki Tsunoda Racing in Red Bull in front Japanese Crowd 🏎️",
    "Maclaren Big Lead in both Championship, is it a bad sign?🔥",
    "Kimi winning his first Grand Prix soon 🔧",
    "Over 220,000 attendance in Chinese Grand Prix 🏁",
  ])
  const [nextRace, setNextRace] = useState<NextRaceInfo>({
    date: "2025-04-06",
    time: "06:00:00",
    raceName: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2025",
    circuit: "FORMULA 1 LENOVO JAPANESE GRAND PRIX 2025",
  })
  const [player, setPlayer] = useState<any>(null)
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>({
    isActive: false,
    currentYear: new Date().getFullYear()
  })

  useEffect(() => {
    const CACHE_KEY = 'f1_season_info';
    const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes in milliseconds

    const fetchSeasonInfo = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData) as CachedData;
          const isExpired = Date.now() - timestamp > CACHE_DURATION;
          
          if (!isExpired) {
            // Use cached data if not expired
            setSeasonInfo(data);
            return;
          }
        }

        // Fetch fresh data if cache missing or expired
        const currentYear = new Date().getFullYear();
        
        // Fetch current season's last race
        const currentSeasonResponse = await fetch(`https://ergast.com/api/f1/${currentYear}.json`);
        const currentSeasonData = await currentSeasonResponse.json();
        const currentSeasonRaces = currentSeasonData.MRData.RaceTable.Races;
        
        const lastRaceDate = currentSeasonRaces[currentSeasonRaces.length - 1]?.date;
        const lastRaceDateTime = lastRaceDate ? new Date(`${lastRaceDate}T00:00:00Z`) : null;
        const isSeasonFinished = lastRaceDateTime ? new Date() > lastRaceDateTime : false;

        let seasonInfoData;

        // If current season is finished, fetch next season's first race
        if (isSeasonFinished) {
          const nextSeasonResponse = await fetch(`https://ergast.com/api/f1/${currentYear + 1}.json`);
          const nextSeasonData = await nextSeasonResponse.json();
          const nextSeasonRaces = nextSeasonData.MRData.RaceTable.Races;
          const nextSeasonStart = nextSeasonRaces[0]?.date;

          seasonInfoData = {
            isActive: false,
            currentYear,
            nextSeasonStart: nextSeasonStart ? `${nextSeasonStart}T00:00:00Z` : undefined,
            lastRaceDate: lastRaceDate
          };
        } else {
          seasonInfoData = {
            isActive: true,
            currentYear,
            lastRaceDate: lastRaceDate
          };
        }

        // Cache the new data
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: seasonInfoData,
          timestamp: Date.now()
        }));

        setSeasonInfo(seasonInfoData);
      } catch (error) {
        console.error('Failed to fetch season info:', error);
        
        // On error, try to use cached data regardless of expiration
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { data } = JSON.parse(cachedData) as CachedData;
          setSeasonInfo(data);
        }
      }
    };

    fetchSeasonInfo();
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const targetDate = seasonInfo.isActive 
        ? new Date(`${nextRace.date}T${nextRace.time}`)
        : seasonInfo.nextSeasonStart 
          ? new Date(seasonInfo.nextSeasonStart)
          : new Date(`${seasonInfo.currentYear + 1}-03-01T00:00:00Z`) // Fallback date

      const difference = targetDate.getTime() - new Date().getTime()

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [nextRace, seasonInfo])

  useEffect(() => {
    // Load the Vimeo Player API script
    const tag = document.createElement('script')
    tag.src = 'https://player.vimeo.com/api/player.js'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Initialize Vimeo player when script is loaded
    tag.onload = () => {
      const vimeoPlayer = new (window as any).Vimeo.Player('vimeo-player', {
        id: '45149087',
        background: true,
        autoplay: true,
        loop: true,
        muted: true,
        controls: false,
        responsive: true,
        width: '80vw',
        // t: '7s'
      })

      setPlayer(vimeoPlayer)

      vimeoPlayer.on('error', function(error: any) {
        console.error('Vimeo Player Error:', error)
      })
    }

    // Cleanup
    return () => {
      if (player) {
        player.destroy()
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white text-xl">Loading Race Data.......</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md bg-black/40 border-red-500/20">
          <CardContent className="flex flex-col items-center space-y-4 p-6">
            <p className="text-red-500 text-xl">Error: {error}</p>
            <Button onClick={() => window.location.reload()} variant="destructive">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-16 sm:pt-24 text-white font-sans relative">
      {/* Background Video Container */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
        <div 
          id="vimeo-player"
          className="absolute w-full h-full pointer-events-none"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: '100%',
            minHeight: '100%',
            width: '177.77777778vh', // 16:9 aspect ratio
            height: '56.25vw' // 16:9 aspect ratio
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Marquee Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed-marquee-header bg-black/40 backdrop-blur-md border-b border-yellow-500/20 z-30"
      >
        <div className="flex justify-between items-center px-4 w-full">
          <div className="marquee-container">
            <div className="animate-marquee">
              <div className="marquee-content">
                {newsItems.map((item, index) => (
                  <span key={index} className="mx-8 text-sm font-bold tracking-wider text-gray-300">
                    {item}
                  </span>
                ))}
                {newsItems.map((item, index) => (
                  <span key={`duplicate-${index}`} className="mx-8 text-sm font-bold tracking-wider text-gray-300">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-2 max-w-7xl">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center mb-8 sm:mb-16 lg:mb-24">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-8 sm:space-y-12 relative z-10"
          >
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-none mb-4 sm:mb-6 bg-gradient-to-r from-white to-yellow-500 bg-clip-text text-transparent">
                LATEST RACE
              </h1>
              {/* <div className="flex items-center gap-4">
                <div className="h-1 w-24 bg-gradient-to-r from-yellow-500 to-yellow-300" />
                <p className="text-xl font-light tracking-wider text-gray-300">{nextRace.circuit}</p>
              </div> */}
            </div>

            {/* Podium Results Card */}
            <DriversStandings />
          </motion.div>

          {/* Right Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col gap-8"
          >
            <Card className="bg-gradient-to-br from-black/60 to-gray-900/60 backdrop-blur-lg border-white/10 hover:border-yellow-500/30 transition-all duration-500 shadow-2xl shadow-black/20">
              <CardContent className="p-8">
                <div className="flex flex-col h-full">
                  <div className="flex flex-col items-center gap-8 pt-14">
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-yellow-500 bg-clip-text text-transparent tracking-tight">
                      {nextRace.raceName}
                    </h2>

                    <Card className="bg-gradient-to-br from-black/80 to-gray-900/80 border-white/10 w-full hover:border-yellow-500/20 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className="flex items-center justify-center">
                          <Clock className="text-yellow-500 mr-6 h-6 w-6" />
                          <div className="grid grid-cols-4 gap-6">
                            {Object.entries(timeLeft).map(([unit, value]) => (
                              <div key={unit} className="text-center">
                                <span className="text-4xl font-bold text-white tabular-nums block mb-2">
                                  {value.toString().padStart(2, "0")}
                                </span>
                                <span className="text-xs font-medium uppercase tracking-widest text-yellow-500">
                                  {unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <p className="text-base font-light tracking-wider text-gray-400 text-center">
                      Race Begins{" "}
                      <span className="text-yellow-500 font-medium block mt-1">
                        {new Date(`${nextRace.date}T${nextRace.time}`).toLocaleString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZoneName: "short",
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phantom Wallet Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8"
            >
              <Card className="bg-black/40 backdrop-blur-sm border-white/10 overflow-hidden group hover:border-yellow-500/50 transition-all duration-300 h-[400px]">
                <CardContent className="p-8 flex flex-col justify-between h-full relative">
                  <div className="absolute inset-0">
                    <img 
                      src="/assets/images/banner2.jpg" 
                      alt="Phantom Wallet Banner"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
                  </div>
                  
                  <div className="relative space-y-2">
                    <h3 className="text-3xl font-bold text-white">Get Started with Phantom</h3>
                  </div>
                  
                  <div className="relative flex gap-4">
                    <a href="https://apps.apple.com/app/phantom-solana-wallet/id1598432977" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1">
                      <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-lg py-6">
                        App Store
                      </Button>
                    </a>
                    <a href="https://play.google.com/store/apps/details?id=app.phantom" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex-1">
                      <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-lg py-6">
                        Play Store
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}

