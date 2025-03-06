"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "./ui/card"

interface Driver {
  position: string
  points: string
  Driver: {
    givenName: string
    familyName: string
    code: string
    nationality: string
  }
  Constructors: Array<{
    name: string
    constructorId: string
  }>
}

interface SeasonInfo {
  isActive: boolean
  currentYear: number
  nextSeasonStart?: string
  lastRaceDate?: string
}

export default function DriversStandings() {
  const [standings, setStandings] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seasonInfo, setSeasonInfo] = useState<SeasonInfo>({
    isActive: false,
    currentYear: new Date().getFullYear()
  })

  useEffect(() => {
    const fetchSeasonData = async () => {
      try {
        setLoading(true)
        
        // Get current year
        const currentYear = new Date().getFullYear()
        
        // Fetch current season's last race
        const currentSeasonResponse = await fetch(`https://ergast.com/api/f1/${currentYear}.json`)
        const currentSeasonData = await currentSeasonResponse.json()
        const currentSeasonRaces = currentSeasonData.MRData.RaceTable.Races
        
        // Get last race date of current season
        const lastRaceDate = currentSeasonRaces[currentSeasonRaces.length - 1]?.date
        const lastRaceDateTime = lastRaceDate ? new Date(`${lastRaceDate}T00:00:00Z`) : null
        const isSeasonFinished = lastRaceDateTime ? new Date() > lastRaceDateTime : false

        // If current season is finished, fetch next season's first race
        let nextSeasonStart
        if (isSeasonFinished) {
          const nextSeasonResponse = await fetch(`https://ergast.com/api/f1/${currentYear + 1}.json`)
          const nextSeasonData = await nextSeasonResponse.json()
          const nextSeasonRaces = nextSeasonData.MRData.RaceTable.Races
          nextSeasonStart = nextSeasonRaces[0]?.date
        }

        // Fetch standings
        const standingsResponse = await fetch(`https://ergast.com/api/f1/2024/driverStandings.json`)
        const standingsData = await standingsResponse.json()
        const driverStandings = standingsData.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || []

        // Update states
        setSeasonInfo({
          isActive: !isSeasonFinished,
          currentYear,
          nextSeasonStart: nextSeasonStart ? `${nextSeasonStart}T00:00:00Z` : undefined,
          lastRaceDate: lastRaceDate
        })
        setStandings(driverStandings.slice(0, 3))

      } catch (err) {
        setError('Failed to fetch F1 data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSeasonData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-yellow-500 bg-clip-text text-transparent mb-4">
          Top 3 Championship Leaders
        </h2>
      </div>

      <div className="grid gap-4">
        {standings.map((standing, index) => (
          <Card 
            key={standing.Driver.code}
            className={`bg-[#1a1b23] border-gray-800 hover:border-yellow-500/50 transition-all duration-300
              ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20' : ''}
              ${index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20' : ''}
              ${index === 2 ? 'bg-gradient-to-r from-yellow-700/20 to-yellow-800/20' : ''}`}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {/* Position */}
              <div className="flex-shrink-0 w-12 text-center">
                <span className="text-2xl font-bold text-gray-400">
                  {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                </span>
              </div>

              {/* Driver Info */}
              <div className="flex-grow">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded">
                      {standing.Driver.code}
                    </span>
                    <span className="text-lg font-bold text-white">
                      {standing.Driver.givenName} {standing.Driver.familyName}
                      <span className="text-sm text-gray-400 mt-1 ml-2">
                        ( {standing.Constructors[0].name} )
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <span className="text-xl font-bold text-white">
                  {standing.points}
                </span>
                <span className="text-gray-400 text-sm ml-1">PTS</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 