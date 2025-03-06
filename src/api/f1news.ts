export async function getF1News(): Promise<string[]> {
  try {
    // For now, returning mock data
    return [
      "Max Verstappen dominates in qualifying 🏎️",
      "Ferrari showing strong pace in practice 🔥",
      "Mercedes brings major upgrades to next race 🔧",
      "Exciting battle for midfield positions 🏁",
    ]
  } catch (error) {
    console.error('Failed to fetch news:', error)
    throw new Error("Failed to fetch news")
  }
} 