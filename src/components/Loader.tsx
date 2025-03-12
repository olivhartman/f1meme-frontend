import type React from "react"

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black">
      <div className="relative w-12 h-12">
        <div
          className="w-full h-full rounded-full absolute
                        border-4 border-solid border-gray-200"
        ></div>
        <div
          className="w-full h-full rounded-full animate-spin absolute
                        border-4 border-solid border-yellow-500 border-t-transparent"
        ></div>
      </div>
    </div>
  )
}

export default Loader

