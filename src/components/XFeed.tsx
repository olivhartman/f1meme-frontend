"use client"

import { useEffect } from "react"

const XFeed = () => {
  useEffect(() => {
    // Load Taggbox script
    const script = document.createElement('script')
    script.src = "https://widget.taggbox.com/embed-lite.min.js"
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div 
      className="taggbox w-full h-full" 
      data-widget-id="2157566" 
      data-tags="false"
    />
  )
}

export default XFeed
