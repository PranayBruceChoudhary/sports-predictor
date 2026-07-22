export default function Home() {
  // A quick array of sports emojis we can use as "transparent images"
  const sportsIcons = ["🏈", "🏀", "⚾", "⚽", "🏒"];

  return (
    // 'flex' puts things in a row side-by-side
    <div className="flex min-h-screen bg-gray-100">
      
      {/* LEFT BANNER */}
      {/* bg-blue-800 is the color, w-24 makes it a specific width, hidden md:flex hides it on tiny phone screens */}
      <aside className="hidden md:flex w-24 lg:w-32 bg-blue-800 flex-col justify-around items-center py-10 shadow-lg z-10">
        {sportsIcons.map((icon, index) => (
          // opacity-40 makes them look transparent!
          <div key={`left-${index}`} className="text-5xl lg:text-6xl opacity-40 hover:opacity-100 transition-opacity cursor-default">
            {icon}
          </div>
        ))}
      </aside>

      {/* MAIN CENTER CONTENT */}
      {/* flex-1 makes this middle section take up all the remaining space */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4 text-center">
          Calling The Lock
        </h1>
        <p className="text-2xl md:text-2xl font-bold text-blue-800 mb-4 text-center">
          Your Ultimate Sports Prediction Platform
        </p>
        <p className="text-xl text-gray-700 text-center mb-8">
          Log in to make your weekly picks, create and compete in leagues, makes friends and more!
        </p>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg shadow-md transition-transform hover:scale-105">
          Sign In
        </button>
      </main>

      {/* RIGHT BANNER */}
      <aside className="hidden md:flex w-24 lg:w-32 bg-blue-800 flex-col justify-around items-center py-10 shadow-lg z-10">
        {sportsIcons.reverse().map((icon, index) => (
          <div key={`right-${index}`} className="text-5xl lg:text-6xl opacity-40 hover:opacity-100 transition-opacity cursor-default">
            {icon}
          </div>
        ))}
      </aside>

    </div>
  );
}