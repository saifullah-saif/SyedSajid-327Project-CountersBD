export default function Timeline({ events }) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 top-0 bottom-0 w-1 bg-zinc-700"></div>

      <div className="space-y-12">
        {events.map((event, index) => (
          <div key={index} className="relative">
            <div className={`flex flex-col md:flex-row items-center ${index % 2 === 0 ? "md:flex-row-reverse" : ""}`}>
              {/* Timeline dot */}
              <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-5 h-5 rounded-full bg-red-600 border-4 border-zinc-800 z-10"></div>

              {/* Content */}
              <div
                className={`w-full md:w-1/2 ${index % 2 === 0 ? "md:pl-0 md:pr-12" : "md:pl-12 md:pr-0"} pl-8 md:pl-0`}
              >
                <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                  <div className="text-red-500 font-bold mb-2">{event.year}</div>
                  <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                  <p className="text-zinc-300">{event.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
