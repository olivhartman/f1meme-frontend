interface NextRaceInfo {
  date: string;
  time: string;
  raceName: string;
  circuit: string;
}

export async function getNextRace(): Promise<NextRaceInfo> {
  try {
    // For now, returning mock data
    return {
      date: "2025-03-16",
      time: "05:00:00Z",
      raceName: "Australian Grand Prix",
      circuit: "Melbourne Grand Prix Circuit",
    }
  } catch (error) {
    console.error('Failed to fetch next race:', error)
    throw new Error("Failed to fetch next race data")
  }
} 