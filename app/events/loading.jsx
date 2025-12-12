export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div className="h-10 w-48 bg-zinc-800 rounded-md animate-pulse"></div>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
            <div className="h-10 w-full md:w-64 bg-zinc-800 rounded-full animate-pulse"></div>
            <div className="h-10 w-32 bg-zinc-800 rounded-full animate-pulse"></div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64">
            <div className="bg-zinc-900 rounded-lg p-4 mb-6">
              <div className="h-6 w-32 bg-zinc-800 rounded-md animate-pulse mb-4"></div>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-24 bg-zinc-800 rounded-full animate-pulse"></div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4 mb-6">
              <div className="h-6 w-24 bg-zinc-800 rounded-md animate-pulse mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse mr-2"></div>
                    <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-zinc-800 rounded-lg overflow-hidden">
                  <div className="h-40 bg-zinc-700 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-6 w-3/4 bg-zinc-700 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 w-full bg-zinc-700 rounded animate-pulse"></div>
                      <div className="h-4 w-2/3 bg-zinc-700 rounded animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-zinc-700 rounded animate-pulse"></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 w-16 bg-zinc-700 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-zinc-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
